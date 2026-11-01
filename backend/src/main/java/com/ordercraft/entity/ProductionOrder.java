package com.ordercraft.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_orders")
public class ProductionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false, length = 50)
    private String productionNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductionOrderStatus status = ProductionOrderStatus.PLANNED;

    @NotNull
    @Min(value = 1, message = "Planned quantity must be at least 1")
    @Column(nullable = false)
    private Integer plannedQuantity;

    @NotNull
    @Min(value = 0, message = "Completed quantity cannot be negative")
    @Column(nullable = false)
    private Integer completedQuantity = 0;

    private LocalDate startDate;

    private LocalDate completionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;

    public ProductionOrder() {
    }

    public ProductionOrder(Long id, String productionNumber, SalesOrder salesOrder, ProductionOrderStatus status, Integer plannedQuantity, Integer completedQuantity, LocalDate startDate, LocalDate completionDate, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.productionNumber = productionNumber;
        this.salesOrder = salesOrder;
        this.status = status != null ? status : ProductionOrderStatus.PLANNED;
        this.plannedQuantity = plannedQuantity;
        this.completedQuantity = completedQuantity != null ? completedQuantity : 0;
        this.startDate = startDate;
        this.completionDate = completionDate;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ProductionOrderStatus.PLANNED;
        }
        if (completedQuantity == null) {
            completedQuantity = 0;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductionNumber() { return productionNumber; }
    public void setProductionNumber(String productionNumber) { this.productionNumber = productionNumber; }

    public SalesOrder getSalesOrder() { return salesOrder; }
    public void setSalesOrder(SalesOrder salesOrder) { this.salesOrder = salesOrder; }

    public ProductionOrderStatus getStatus() { return status; }
    public void setStatus(ProductionOrderStatus status) { this.status = status; }

    public Integer getPlannedQuantity() { return plannedQuantity; }
    public void setPlannedQuantity(Integer plannedQuantity) { this.plannedQuantity = plannedQuantity; }

    public Integer getCompletedQuantity() { return completedQuantity; }
    public void setCompletedQuantity(Integer completedQuantity) { this.completedQuantity = completedQuantity; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getCompletionDate() { return completionDate; }
    public void setCompletionDate(LocalDate completionDate) { this.completionDate = completionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
