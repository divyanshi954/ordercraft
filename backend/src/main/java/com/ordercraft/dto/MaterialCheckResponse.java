package com.ordercraft.dto;

import com.ordercraft.entity.OrderStatus;
import java.util.ArrayList;
import java.util.List;

public class MaterialCheckResponse {

    private Long salesOrderId;
    private String orderNumber;
    private String customerName;
    private OrderStatus orderStatus;
    private boolean hasAnyShortage;
    private String message;
    private List<MaterialRequirementItemDto> requirements = new ArrayList<>();

    public MaterialCheckResponse() {
    }

    public MaterialCheckResponse(Long salesOrderId, String orderNumber, String customerName, OrderStatus orderStatus,
                                boolean hasAnyShortage, String message, List<MaterialRequirementItemDto> requirements) {
        this.salesOrderId = salesOrderId;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.orderStatus = orderStatus;
        this.hasAnyShortage = hasAnyShortage;
        this.message = message;
        this.requirements = requirements != null ? requirements : new ArrayList<>();
    }

    public Long getSalesOrderId() { return salesOrderId; }
    public void setSalesOrderId(Long salesOrderId) { this.salesOrderId = salesOrderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public boolean isHasAnyShortage() { return hasAnyShortage; }
    public void setHasAnyShortage(boolean hasAnyShortage) { this.hasAnyShortage = hasAnyShortage; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<MaterialRequirementItemDto> getRequirements() { return requirements; }
    public void setRequirements(List<MaterialRequirementItemDto> requirements) { this.requirements = requirements; }
}
