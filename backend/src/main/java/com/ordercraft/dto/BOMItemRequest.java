package com.ordercraft.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class BOMItemRequest {

    @NotNull(message = "Material ID is required")
    private Long materialId;

    @NotNull(message = "Quantity required is required")
    @DecimalMin(value = "0.0001", message = "Quantity required must be positive")
    private BigDecimal quantityRequired;

    public BOMItemRequest() {
    }

    public BOMItemRequest(Long materialId, BigDecimal quantityRequired) {
        this.materialId = materialId;
        this.quantityRequired = quantityRequired;
    }

    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }

    public BigDecimal getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(BigDecimal quantityRequired) { this.quantityRequired = quantityRequired; }
}
