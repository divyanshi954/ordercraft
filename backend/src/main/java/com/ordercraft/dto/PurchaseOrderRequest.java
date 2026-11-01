package com.ordercraft.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class PurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private Long salesOrderId;

    private LocalDate orderDate;

    private String notes;

    @NotEmpty(message = "At least one purchase order item is required")
    private List<PurchaseOrderItemRequest> items;

    public PurchaseOrderRequest() {
    }

    public PurchaseOrderRequest(Long supplierId, Long salesOrderId, LocalDate orderDate, String notes, List<PurchaseOrderItemRequest> items) {
        this.supplierId = supplierId;
        this.salesOrderId = salesOrderId;
        this.orderDate = orderDate;
        this.notes = notes;
        this.items = items;
    }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public Long getSalesOrderId() { return salesOrderId; }
    public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PurchaseOrderItemRequest> getItems() { return items; }
    public void setItems(List<PurchaseOrderItemRequest> items) { this.items = items; }
}
