package com.ordercraft.dto;

import java.math.BigDecimal;

public class MaterialRequirementItemDto {

    private Long materialId;
    private String materialCode;
    private String materialName;
    private String unit;
    private BigDecimal requiredQuantity;
    private BigDecimal currentStock;
    private BigDecimal reservedStock;
    private BigDecimal availableStock;
    private BigDecimal shortageQuantity;
    private boolean hasShortage;

    public MaterialRequirementItemDto() {
    }

    public MaterialRequirementItemDto(Long materialId, String materialCode, String materialName, String unit,
                                     BigDecimal requiredQuantity, BigDecimal currentStock, BigDecimal reservedStock,
                                     BigDecimal availableStock, BigDecimal shortageQuantity, boolean hasShortage) {
        this.materialId = materialId;
        this.materialCode = materialCode;
        this.materialName = materialName;
        this.unit = unit;
        this.requiredQuantity = requiredQuantity;
        this.currentStock = currentStock;
        this.reservedStock = reservedStock;
        this.availableStock = availableStock;
        this.shortageQuantity = shortageQuantity;
        this.hasShortage = hasShortage;
    }

    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }

    public String getMaterialCode() { return materialCode; }
    public void setMaterialCode(String materialCode) { this.materialCode = materialCode; }

    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(BigDecimal requiredQuantity) { this.requiredQuantity = requiredQuantity; }

    public BigDecimal getCurrentStock() { return currentStock; }
    public void setCurrentStock(BigDecimal currentStock) { this.currentStock = currentStock; }

    public BigDecimal getReservedStock() { return reservedStock; }
    public void setReservedStock(BigDecimal reservedStock) { this.reservedStock = reservedStock; }

    public BigDecimal getAvailableStock() { return availableStock; }
    public void setAvailableStock(BigDecimal availableStock) { this.availableStock = availableStock; }

    public BigDecimal getShortageQuantity() { return shortageQuantity; }
    public void setShortageQuantity(BigDecimal shortageQuantity) { this.shortageQuantity = shortageQuantity; }

    public boolean isHasShortage() { return hasShortage; }
    public void setHasShortage(boolean hasShortage) { this.hasShortage = hasShortage; }
}
