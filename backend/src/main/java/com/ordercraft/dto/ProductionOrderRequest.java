package com.ordercraft.dto;

import jakarta.validation.constraints.NotNull;

public class ProductionOrderRequest {

    @NotNull(message = "Sales Order ID is required")
    private Long salesOrderId;

    private Integer plannedQuantity;

    private String notes;

    public ProductionOrderRequest() {
    }

    public ProductionOrderRequest(Long salesOrderId, Integer plannedQuantity, String notes) {
        this.salesOrderId = salesOrderId;
        this.plannedQuantity = plannedQuantity;
        this.notes = notes;
    }

    public Long getSalesOrderId() { return salesOrderId; }
    public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }

    public Integer getPlannedQuantity() { return plannedQuantity; }
    public void setPlannedQuantity(Integer plannedQuantity) { this.plannedQuantity = plannedQuantity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
