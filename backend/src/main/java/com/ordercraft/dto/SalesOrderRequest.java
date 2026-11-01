package com.ordercraft.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class SalesOrderRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private LocalDate orderDate;

    private String notes;

    @NotEmpty(message = "At least one order item is required")
    private List<SalesOrderItemRequest> items;

    public SalesOrderRequest() {
    }

    public SalesOrderRequest(Long customerId, LocalDate orderDate, String notes, List<SalesOrderItemRequest> items) {
        this.customerId = customerId;
        this.orderDate = orderDate;
        this.notes = notes;
        this.items = items;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SalesOrderItemRequest> getItems() { return items; }
    public void setItems(List<SalesOrderItemRequest> items) { this.items = items; }
}
