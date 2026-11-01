package com.ordercraft.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "bom_items")
public class BOMItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    @JsonIgnore
    private BOM bom;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @NotNull
    @DecimalMin(value = "0.0001", message = "Quantity required must be positive")
    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal quantityRequired;

    public BOMItem() {
    }

    public BOMItem(Long id, BOM bom, Material material, BigDecimal quantityRequired) {
        this.id = id;
        this.bom = bom;
        this.material = material;
        this.quantityRequired = quantityRequired;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BOM getBom() { return bom; }
    public void setBom(BOM bom) { this.bom = bom; }

    public Material getMaterial() { return material; }
    public void setMaterial(Material material) { this.material = material; }

    public BigDecimal getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(BigDecimal quantityRequired) { this.quantityRequired = quantityRequired; }
}
