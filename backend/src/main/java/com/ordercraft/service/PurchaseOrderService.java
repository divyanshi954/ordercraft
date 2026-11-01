package com.ordercraft.service;

import com.ordercraft.dto.PurchaseOrderItemRequest;
import com.ordercraft.dto.PurchaseOrderRequest;
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
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final MaterialRepository materialRepository;
    private final SalesOrderService salesOrderService;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                SupplierRepository supplierRepository,
                                SalesOrderRepository salesOrderRepository,
                                MaterialRepository materialRepository,
                                SalesOrderService salesOrderService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.materialRepository = materialRepository;
        this.salesOrderService = salesOrderService;
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrder> getAllPurchaseOrders(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return purchaseOrderRepository.searchPurchaseOrders(search.trim(), pageable);
        }
        return purchaseOrderRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPurchaseOrdersByStatus(PurchaseOrderStatus status) {
        return purchaseOrderRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
    }

    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        SalesOrder salesOrder = null;
        if (request.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(request.getSalesOrderId())
                    .orElse(null);
        }

        String poNumber = generatePoNumber();

        PurchaseOrder po = new PurchaseOrder();
        po.setPurchaseOrderNumber(poNumber);
        po.setSupplier(supplier);
        po.setSalesOrder(salesOrder);
        po.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());
        po.setStatus(PurchaseOrderStatus.DRAFT);
        po.setNotes(request.getNotes());
        po.setCreatedAt(LocalDateTime.now());

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findById(itemReq.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + itemReq.getMaterialId()));

            BigDecimal subtotal = itemReq.getUnitPrice().multiply(itemReq.getQuantity());
            PurchaseOrderItem item = new PurchaseOrderItem(null, po, material, itemReq.getQuantity(), itemReq.getUnitPrice(), subtotal);
            po.addItem(item);
        }

        po.calculateTotalAmount();
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder markOrdered(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);
        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT purchase orders can be marked as ORDERED. Current: " + po.getStatus());
        }
        po.setStatus(PurchaseOrderStatus.ORDERED);
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder receivePurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new BusinessException("Purchase order has already been received");
        }
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessException("Cannot receive a cancelled purchase order");
        }

        // 1. Increase inventory stock for each material
        // Pre-aggregate received quantities by material ID to safely handle duplicate material lines
        Map<Long, BigDecimal> receivedByMaterial = new LinkedHashMap<>();
        for (PurchaseOrderItem item : po.getItems()) {
            if (item.getMaterial() != null && item.getMaterial().getId() != null) {
                Long matId = item.getMaterial().getId();
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                receivedByMaterial.merge(matId, qty, BigDecimal::add);
            }
        }

        for (Map.Entry<Long, BigDecimal> entry : receivedByMaterial.entrySet()) {
            Material material = materialRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + entry.getKey()));
            BigDecimal current = material.getCurrentStock() != null ? material.getCurrentStock() : BigDecimal.ZERO;
            material.setCurrentStock(current.add(entry.getValue()));
            materialRepository.save(material);
        }

        // 2. Mark PO as RECEIVED
        po.setStatus(PurchaseOrderStatus.RECEIVED);
        PurchaseOrder savedPo = purchaseOrderRepository.save(po);

        // 3. If tied to a Sales Order or general shortage, check if the sales order can now be made ready for production
        if (po.getSalesOrder() != null) {
            SalesOrder so = po.getSalesOrder();
            if (so.getStatus() == OrderStatus.SHORTAGE || so.getStatus() == OrderStatus.CONFIRMED) {
                try {
                    salesOrderService.checkMaterials(so.getId());
                } catch (Exception ignored) {
                    // If still has other shortages, it will stay in SHORTAGE
                }
            }
        }

        return savedPo;
    }

    public PurchaseOrder cancelPurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);
        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new BusinessException("Cannot cancel an already received purchase order");
        }
        po.setStatus(PurchaseOrderStatus.CANCELLED);
        return purchaseOrderRepository.save(po);
    }

    private synchronized String generatePoNumber() {
        long count = purchaseOrderRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("PO-%d-%04d", year, count);
    }
}
