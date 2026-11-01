package com.ordercraft.dto;

import com.ordercraft.entity.Material;
import com.ordercraft.entity.SalesOrder;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDto {

    private long totalSalesOrders;
    private long pendingOrders;
    private long ordersInProduction;
    private long completedOrders;
    private long lowStockCount;
    private long totalPurchaseOrders;
    private long outstandingInvoicesCount;
    private BigDecimal totalRevenue;
    private BigDecimal pendingPayments;
    private List<Material> lowStockMaterials;
    private List<SalesOrder> recentOrders;

    public DashboardSummaryDto() {
    }

    public DashboardSummaryDto(long totalSalesOrders, long pendingOrders, long ordersInProduction,
                               long completedOrders, long lowStockCount, long totalPurchaseOrders,
                               long outstandingInvoicesCount, BigDecimal totalRevenue,
                               BigDecimal pendingPayments, List<Material> lowStockMaterials,
                               List<SalesOrder> recentOrders) {
        this.totalSalesOrders = totalSalesOrders;
        this.pendingOrders = pendingOrders;
        this.ordersInProduction = ordersInProduction;
        this.completedOrders = completedOrders;
        this.lowStockCount = lowStockCount;
        this.totalPurchaseOrders = totalPurchaseOrders;
        this.outstandingInvoicesCount = outstandingInvoicesCount;
        this.totalRevenue = totalRevenue;
        this.pendingPayments = pendingPayments;
        this.lowStockMaterials = lowStockMaterials;
        this.recentOrders = recentOrders;
    }

    public long getTotalSalesOrders() { return totalSalesOrders; }
    public void setTotalSalesOrders(long totalSalesOrders) { this.totalSalesOrders = totalSalesOrders; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public long getOrdersInProduction() { return ordersInProduction; }
    public void setOrdersInProduction(long ordersInProduction) { this.ordersInProduction = ordersInProduction; }

    public long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(long completedOrders) { this.completedOrders = completedOrders; }

    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }

    public long getTotalPurchaseOrders() { return totalPurchaseOrders; }
    public void setTotalPurchaseOrders(long totalPurchaseOrders) { this.totalPurchaseOrders = totalPurchaseOrders; }

    public long getOutstandingInvoicesCount() { return outstandingInvoicesCount; }
    public void setOutstandingInvoicesCount(long outstandingInvoicesCount) { this.outstandingInvoicesCount = outstandingInvoicesCount; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public BigDecimal getPendingPayments() { return pendingPayments; }
    public void setPendingPayments(BigDecimal pendingPayments) { this.pendingPayments = pendingPayments; }

    public List<Material> getLowStockMaterials() { return lowStockMaterials; }
    public void setLowStockMaterials(List<Material> lowStockMaterials) { this.lowStockMaterials = lowStockMaterials; }

    public List<SalesOrder> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<SalesOrder> recentOrders) { this.recentOrders = recentOrders; }
}
