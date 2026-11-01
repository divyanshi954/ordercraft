package com.ordercraft.service;

import com.ordercraft.dto.ProductionOrderRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ProductionOrderService {

    private final ProductionOrderRepository productionOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final BOMRepository bomRepository;
    private final MaterialRepository materialRepository;

    public ProductionOrderService(ProductionOrderRepository productionOrderRepository,
                                  SalesOrderRepository salesOrderRepository,
                                  BOMRepository bomRepository,
                                  MaterialRepository materialRepository) {
        this.productionOrderRepository = productionOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.bomRepository = bomRepository;
        this.materialRepository = materialRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductionOrder> getAllProductionOrders(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return productionOrderRepository.searchProductionOrders(search.trim(), pageable);
        }
        return productionOrderRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<ProductionOrder> getProductionOrdersByStatus(ProductionOrderStatus status) {
        return productionOrderRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public ProductionOrder getProductionOrderById(Long id) {
        return productionOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found with id: " + id));
    }

    public ProductionOrder planProductionOrder(ProductionOrderRequest request) {
        SalesOrder salesOrder = salesOrderRepository.findByIdWithItems(request.getSalesOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + request.getSalesOrderId()));

        if (salesOrder.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot plan production: Sales order is cancelled");
        }

        if (salesOrder.getStatus() != OrderStatus.READY_FOR_PRODUCTION) {
            throw new BusinessException("Cannot plan production: Sales order must be in READY_FOR_PRODUCTION status. Current: " + salesOrder.getStatus());
        }

        // Calculate total items quantity
        int totalQuantity = salesOrder.getItems().stream()
                .mapToInt(SalesOrderItem::getQuantity)
                .sum();

        int plannedQty = (request.getPlannedQuantity() != null && request.getPlannedQuantity() > 0)
                ? request.getPlannedQuantity()
                : totalQuantity;

        String prodNumber = generateProductionNumber();

        ProductionOrder prodOrder = new ProductionOrder();
        prodOrder.setProductionNumber(prodNumber);
        prodOrder.setSalesOrder(salesOrder);
        prodOrder.setStatus(ProductionOrderStatus.PLANNED);
        prodOrder.setPlannedQuantity(plannedQty);
        prodOrder.setCompletedQuantity(0);
        prodOrder.setNotes(request.getNotes());
        prodOrder.setCreatedAt(LocalDateTime.now());

        return productionOrderRepository.save(prodOrder);
    }

    public ProductionOrder startProduction(Long id) {
        ProductionOrder prodOrder = getProductionOrderById(id);

        if (prodOrder.getStatus() != ProductionOrderStatus.PLANNED) {
            throw new BusinessException("Production can only be started from PLANNED status. Current: " + prodOrder.getStatus());
        }

        SalesOrder salesOrder = salesOrderRepository.findByIdWithItems(prodOrder.getSalesOrder().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found: " + prodOrder.getSalesOrder().getId()));

        if (salesOrder.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot start production: Sales order is cancelled");
        }

        if (salesOrder.getStatus() != OrderStatus.READY_FOR_PRODUCTION) {
            throw new BusinessException("Sales order is not ready for production. Current status: " + salesOrder.getStatus());
        }

        // Aggregate total required material consumption across all order items
        Map<Long, BigDecimal> requiredMap = new LinkedHashMap<>();
        for (SalesOrderItem orderItem : salesOrder.getItems()) {
            BOM bom = bomRepository.findActiveBomWithItemsByProductId(orderItem.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("Active BOM not found for product: " + orderItem.getProduct().getName()));

            for (BOMItem bomItem : bom.getItems()) {
                Long matId = bomItem.getMaterial().getId();
                BigDecimal totalReq = bomItem.getQuantityRequired().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
                requiredMap.merge(matId, totalReq, BigDecimal::add);
            }
        }

        // Verify stock is actually available for all materials before making any changes
        for (Map.Entry<Long, BigDecimal> entry : requiredMap.entrySet()) {
            Material material = materialRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + entry.getKey()));
            if (material.getCurrentStock().compareTo(entry.getValue()) < 0) {
                throw new BusinessException("Insufficient stock to consume for material: " + material.getName());
            }
        }

        // Deduct aggregated consumption from inventory and reserved stock
        for (Map.Entry<Long, BigDecimal> entry : requiredMap.entrySet()) {
            Material material = materialRepository.findById(entry.getKey()).orElseThrow();
            BigDecimal consumeQty = entry.getValue();

            material.setCurrentStock(material.getCurrentStock().subtract(consumeQty));

            BigDecimal newReserved = material.getReservedStock().subtract(consumeQty);
            material.setReservedStock(newReserved.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newReserved);

            materialRepository.save(material);
        }

        // Update production order
        prodOrder.setStatus(ProductionOrderStatus.IN_PROGRESS);
        prodOrder.setStartDate(LocalDate.now());

        // Update sales order status
        salesOrder.setStatus(OrderStatus.IN_PRODUCTION);
        salesOrderRepository.save(salesOrder);

        return productionOrderRepository.save(prodOrder);
    }

    public ProductionOrder completeProduction(Long id) {
        ProductionOrder prodOrder = getProductionOrderById(id);

        if (prodOrder.getStatus() != ProductionOrderStatus.IN_PROGRESS) {
            throw new BusinessException("Production can only be completed from IN_PROGRESS status. Current: " + prodOrder.getStatus());
        }

        SalesOrder salesOrder = prodOrder.getSalesOrder();
        if (salesOrder.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot complete production: Associated sales order is cancelled");
        }
        if (salesOrder.getStatus() != OrderStatus.IN_PRODUCTION) {
            throw new BusinessException("Cannot complete production: Sales order is not in production. Current status: " + salesOrder.getStatus());
        }

        prodOrder.setStatus(ProductionOrderStatus.COMPLETED);
        prodOrder.setCompletedQuantity(prodOrder.getPlannedQuantity());
        prodOrder.setCompletionDate(LocalDate.now());

        salesOrder.setStatus(OrderStatus.COMPLETED);
        salesOrderRepository.save(salesOrder);

        return productionOrderRepository.save(prodOrder);
    }

    public ProductionOrder createAndStartForSalesOrder(Long salesOrderId) {
        ProductionOrderRequest request = new ProductionOrderRequest(salesOrderId, null, "Created and started automatically");
        ProductionOrder planned = planProductionOrder(request);
        return startProduction(planned.getId());
    }

    private synchronized String generateProductionNumber() {
        long count = productionOrderRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("PRD-%d-%04d", year, count);
    }
}
