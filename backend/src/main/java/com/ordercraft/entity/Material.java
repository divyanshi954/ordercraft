package com.ordercraft.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false, length = 50)
    private String materialCode;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String unit;

    @NotNull
    @DecimalMin(value = "0.00", message = "Current stock cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.00", message = "Reserved stock cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedStock = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.00", message = "Reorder level cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    private LocalDateTime createdAt;

    public Material() {
    }

    public Material(Long id, String materialCode, String name, String unit, BigDecimal currentStock, BigDecimal reservedStock, BigDecimal reorderLevel, LocalDateTime createdAt) {
        this.id = id;
        this.materialCode = materialCode;
        this.name = name;
        this.unit = unit;
        this.currentStock = currentStock != null ? currentStock : BigDecimal.ZERO;
        this.reservedStock = reservedStock != null ? reservedStock : BigDecimal.ZERO;
        this.reorderLevel = reorderLevel != null ? reorderLevel : BigDecimal.ZERO;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (currentStock == null) {
            currentStock = BigDecimal.ZERO;
        }
        if (reservedStock == null) {
            reservedStock = BigDecimal.ZERO;
        }
        if (reorderLevel == null) {
            reorderLevel = BigDecimal.ZERO;
        }
    }

    public BigDecimal getAvailableStock() {
        BigDecimal cur = currentStock != null ? currentStock : BigDecimal.ZERO;
        BigDecimal res = reservedStock != null ? reservedStock : BigDecimal.ZERO;
        BigDecimal avail = cur.subtract(res);
        return avail.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : avail;
    }

    public boolean isLowStock() {
        if (currentStock == null || reorderLevel == null) {
            return false;
        }
        return currentStock.compareTo(reorderLevel) <= 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMaterialCode() { return materialCode; }
    public void setMaterialCode(String materialCode) { this.materialCode = materialCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getCurrentStock() { return currentStock; }
    public void setCurrentStock(BigDecimal currentStock) { this.currentStock = currentStock; }

    public BigDecimal getReservedStock() { return reservedStock; }
    public void setReservedStock(BigDecimal reservedStock) { this.reservedStock = reservedStock; }

    public BigDecimal getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(BigDecimal reorderLevel) { this.reorderLevel = reorderLevel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
