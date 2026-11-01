package com.ordercraft.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class InvoiceCreateRequest {

    @NotNull(message = "Sales order ID is required")
    private Long salesOrderId;

    private LocalDate dueDate;

    private String notes;

    public InvoiceCreateRequest() {
    }

    public InvoiceCreateRequest(Long salesOrderId, LocalDate dueDate, String notes) {
        this.salesOrderId = salesOrderId;
        this.dueDate = dueDate;
        this.notes = notes;
    }

    public Long getSalesOrderId() { return salesOrderId; }
    public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
