package com.ordercraft.service;

import com.ordercraft.dto.*;
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
import java.util.*;

@Service
@Transactional
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final BOMRepository bomRepository;
    private final ProductionOrderRepository productionOrderRepository;

    public SalesOrderService(SalesOrderRepository salesOrderRepository,
                             CustomerRepository customerRepository,
                             ProductRepository productRepository,
                             MaterialRepository materialRepository,
                             BOMRepository bomRepository,
                             ProductionOrderRepository productionOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.materialRepository = materialRepository;
        this.bomRepository = bomRepository;
        this.productionOrderRepository = productionOrderRepository;
    }

    @Transactional(readOnly = true)
    public Page<SalesOrder> getAllOrders(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return salesOrderRepository.searchOrders(search.trim(), pageable);
        }
        return salesOrderRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<SalesOrder> getOrdersByStatus(OrderStatus status) {
        return salesOrderRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public SalesOrder getOrderById(Long id) {
        return salesOrderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + id));
    }

    public SalesOrder createOrder(SalesOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        String orderNumber = generateOrderNumber();

        SalesOrder order = new SalesOrder();
        order.setOrderNumber(orderNumber);
        order.setCustomer(customer);
        order.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());
        order.setStatus(OrderStatus.DRAFT);
        order.setNotes(request.getNotes());
        order.setCreatedAt(LocalDateTime.now());

        for (SalesOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getUnitPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            SalesOrderItem orderItem = new SalesOrderItem(null, order, product, itemReq.getQuantity(), unitPrice, subtotal);
            order.addItem(orderItem);
        }

        order.calculateTotalAmount();
        return salesOrderRepository.save(order);
    }

    public SalesOrder confirmOrder(Long id) {
        SalesOrder order = getOrderById(id);
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT orders can be confirmed. Current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CONFIRMED);
        salesOrderRepository.save(order);

        // Run material check automatically upon confirmation
        checkMaterials(id);
        return getOrderById(id);
    }

    public MaterialCheckResponse checkMaterials(Long orderId) {
        SalesOrder order = getOrderById(orderId);

        if (order.getStatus() == OrderStatus.READY_FOR_PRODUCTION ||
            order.getStatus() == OrderStatus.IN_PRODUCTION ||
            order.getStatus() == OrderStatus.COMPLETED ||
            order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot perform material check on order in status: " + order.getStatus());
        }

        // Calculate total material requirements
        Map<Long, BigDecimal> requiredMap = new LinkedHashMap<>();
        Map<Long, Material> materialEntityMap = new HashMap<>();

        for (SalesOrderItem item : order.getItems()) {
            BOM bom = bomRepository.findActiveBomWithItemsByProductId(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("No active BOM found for product: " + item.getProduct().getName()));

            for (BOMItem bomItem : bom.getItems()) {
                Long matId = bomItem.getMaterial().getId();
                BigDecimal perUnit = bomItem.getQuantityRequired();
                BigDecimal totalReq = perUnit.multiply(BigDecimal.valueOf(item.getQuantity()));

                requiredMap.merge(matId, totalReq, BigDecimal::add);
                materialEntityMap.put(matId, bomItem.getMaterial());
            }
        }

        List<MaterialRequirementItemDto> requirements = new ArrayList<>();
        boolean hasShortage = false;

        for (Map.Entry<Long, BigDecimal> entry : requiredMap.entrySet()) {
            Long matId = entry.getKey();
            BigDecimal required = entry.getValue();

            // Refresh material from DB to get latest stock
            Material material = materialRepository.findById(matId)
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + matId));

            BigDecimal currentStock = material.getCurrentStock();
            BigDecimal reservedStock = material.getReservedStock();
            BigDecimal availableStock = material.getAvailableStock();

            BigDecimal shortage = BigDecimal.ZERO;
            boolean itemShortage = false;

            if (availableStock.compareTo(required) < 0) {
                shortage = required.subtract(availableStock);
                itemShortage = true;
                hasShortage = true;
            }

            MaterialRequirementItemDto itemDto = new MaterialRequirementItemDto(
                    material.getId(),
                    material.getMaterialCode(),
                    material.getName(),
                    material.getUnit(),
                    required,
                    currentStock,
                    reservedStock,
                    availableStock,
                    shortage,
                    itemShortage
            );
            requirements.add(itemDto);
        }

        String message;
        if (hasShortage) {
            order.setStatus(OrderStatus.SHORTAGE);
            message = "Material shortage detected. Purchase orders must be placed for missing materials.";
        } else {
            // Reserve materials for production
            for (Map.Entry<Long, BigDecimal> entry : requiredMap.entrySet()) {
                Material material = materialRepository.findById(entry.getKey()).orElseThrow();
                material.setReservedStock(material.getReservedStock().add(entry.getValue()));
                materialRepository.save(material);
            }
            order.setStatus(OrderStatus.READY_FOR_PRODUCTION);
            message = "All materials are available and reserved. Order is ready for production!";
        }

        salesOrderRepository.save(order);

        return new MaterialCheckResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomer().getName(),
                order.getStatus(),
                hasShortage,
                message,
                requirements
        );
    }

    @Transactional(readOnly = true)
    public MaterialCheckResponse getMaterialRequirementsPreview(Long orderId) {
        SalesOrder order = getOrderById(orderId);

        Map<Long, BigDecimal> requiredMap = new LinkedHashMap<>();
        for (SalesOrderItem item : order.getItems()) {
            BOM bom = bomRepository.findActiveBomWithItemsByProductId(item.getProduct().getId())
                    .orElseThrow(() -> new BusinessException("No active BOM found for product: " + item.getProduct().getName()));

            for (BOMItem bomItem : bom.getItems()) {
                Long matId = bomItem.getMaterial().getId();
                BigDecimal totalReq = bomItem.getQuantityRequired().multiply(BigDecimal.valueOf(item.getQuantity()));
                requiredMap.merge(matId, totalReq, BigDecimal::add);
            }
        }

        List<MaterialRequirementItemDto> requirements = new ArrayList<>();
        boolean hasShortage = false;

        for (Map.Entry<Long, BigDecimal> entry : requiredMap.entrySet()) {
            Material material = materialRepository.findById(entry.getKey()).orElseThrow();
            BigDecimal required = entry.getValue();
            BigDecimal available = material.getAvailableStock();

            BigDecimal shortage = BigDecimal.ZERO;
            boolean itemShortage = false;
            if (available.compareTo(required) < 0) {
                shortage = required.subtract(available);
                itemShortage = true;
                hasShortage = true;
            }

            requirements.add(new MaterialRequirementItemDto(
                    material.getId(),
                    material.getMaterialCode(),
                    material.getName(),
                    material.getUnit(),
                    required,
                    material.getCurrentStock(),
                    material.getReservedStock(),
                    available,
                    shortage,
                    itemShortage
            ));
        }

        return new MaterialCheckResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomer().getName(),
                order.getStatus(),
                hasShortage,
                hasShortage ? "Shortages detected in inventory" : "All required materials in stock",
                requirements
        );
    }

    public SalesOrder cancelOrder(Long id) {
        SalesOrder order = getOrderById(id);

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Order is already cancelled");
        }

        if (order.getStatus() == OrderStatus.IN_PRODUCTION) {
            throw new BusinessException("Cannot cancel order while production is in progress");
        }

        // Also check if any associated production order is currently IN_PROGRESS
        boolean hasActiveProduction = productionOrderRepository.findBySalesOrderId(order.getId()).stream()
                .anyMatch(po -> po.getStatus() == ProductionOrderStatus.IN_PROGRESS);
        if (hasActiveProduction) {
            throw new BusinessException("Cannot cancel order: Associated production order is currently in progress");
        }

        if (order.getStatus() == OrderStatus.COMPLETED ||
            order.getStatus() == OrderStatus.INVOICED ||
            order.getStatus() == OrderStatus.PAID) {
            throw new BusinessException("Cannot cancel an order in status: " + order.getStatus());
        }

        // If materials were reserved, release them
        if (order.getStatus() == OrderStatus.READY_FOR_PRODUCTION) {
            releaseReservedMaterials(order);

            // Cancel any associated PLANNED production orders
            List<ProductionOrder> plannedOrders = productionOrderRepository.findBySalesOrderId(order.getId()).stream()
                    .filter(po -> po.getStatus() == ProductionOrderStatus.PLANNED)
                    .toList();
            for (ProductionOrder po : plannedOrders) {
                po.setStatus(ProductionOrderStatus.CANCELLED);
                productionOrderRepository.save(po);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        return salesOrderRepository.save(order);
    }

    private void releaseReservedMaterials(SalesOrder order) {
        Map<Long, BigDecimal> releaseMap = new LinkedHashMap<>();

        for (SalesOrderItem item : order.getItems()) {
            bomRepository.findActiveBomWithItemsByProductId(item.getProduct().getId())
                    .ifPresent(bom -> {
                        for (BOMItem bomItem : bom.getItems()) {
                            Long matId = bomItem.getMaterial().getId();
                            BigDecimal reservedAmt = bomItem.getQuantityRequired().multiply(BigDecimal.valueOf(item.getQuantity()));
                            releaseMap.merge(matId, reservedAmt, BigDecimal::add);
                        }
                    });
        }

        for (Map.Entry<Long, BigDecimal> entry : releaseMap.entrySet()) {
            materialRepository.findById(entry.getKey()).ifPresent(material -> {
                BigDecimal newReserved = material.getReservedStock().subtract(entry.getValue());
                material.setReservedStock(newReserved.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newReserved);
                materialRepository.save(material);
            });
        }
    }

    private synchronized String generateOrderNumber() {
        long count = salesOrderRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("SO-%d-%04d", year, count);
    }
}
