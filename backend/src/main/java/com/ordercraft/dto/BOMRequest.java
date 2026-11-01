package com.ordercraft.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class BOMRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private String version = "v1.0";

    private Boolean active = true;

    @NotEmpty(message = "At least one BOM item is required")
    private List<BOMItemRequest> items;

    public BOMRequest() {
    }

    public BOMRequest(Long productId, String version, Boolean active, List<BOMItemRequest> items) {
        this.productId = productId;
        this.version = version;
        this.active = active;
        this.items = items;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public List<BOMItemRequest> getItems() { return items; }
    public void setItems(List<BOMItemRequest> items) { this.items = items; }
}
