package com.ordercraft.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boms")
public class BOM {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String version = "v1.0";

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "bom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<BOMItem> items = new ArrayList<>();

    public BOM() {
    }

    public BOM(Long id, Product product, String version, Boolean active, LocalDateTime createdAt, List<BOMItem> items) {
        this.id = id;
        this.product = product;
        this.version = version != null ? version : "v1.0";
        this.active = active != null ? active : true;
        this.createdAt = createdAt;
        this.items = items != null ? items : new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (active == null) {
            active = true;
        }
        if (version == null) {
            version = "v1.0";
        }
    }

    public void addItem(BOMItem item) {
        items.add(item);
        item.setBom(this);
    }

    public void removeItem(BOMItem item) {
        items.remove(item);
        item.setBom(null);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<BOMItem> getItems() { return items; }
    public void setItems(List<BOMItem> items) { this.items = items; }
}
