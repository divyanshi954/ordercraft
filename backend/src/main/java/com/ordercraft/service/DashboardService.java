package com.ordercraft.service;

import com.ordercraft.dto.DashboardSummaryDto;
import com.ordercraft.entity.InvoiceStatus;
import com.ordercraft.entity.OrderStatus;
import com.ordercraft.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final MaterialRepository materialRepository;
    private final InvoiceRepository invoiceRepository;

    public DashboardService(SalesOrderRepository salesOrderRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            MaterialRepository materialRepository,
                            InvoiceRepository invoiceRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.materialRepository = materialRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public DashboardSummaryDto getDashboardSummary() {
        long totalOrders = salesOrderRepository.count();

        long pendingOrders = salesOrderRepository.countByStatus(OrderStatus.DRAFT)
                + salesOrderRepository.countByStatus(OrderStatus.CONFIRMED)
                + salesOrderRepository.countByStatus(OrderStatus.MATERIAL_CHECK)
                + salesOrderRepository.countByStatus(OrderStatus.SHORTAGE)
                + salesOrderRepository.countByStatus(OrderStatus.READY_FOR_PRODUCTION);

        long inProduction = salesOrderRepository.countByStatus(OrderStatus.IN_PRODUCTION);

        long completedOrders = salesOrderRepository.countByStatus(OrderStatus.COMPLETED)
                + salesOrderRepository.countByStatus(OrderStatus.INVOICED)
                + salesOrderRepository.countByStatus(OrderStatus.PARTIALLY_PAID)
                + salesOrderRepository.countByStatus(OrderStatus.PAID);

        long lowStockCount = materialRepository.countLowStockMaterials();
        long totalPOs = purchaseOrderRepository.count();

        long outstandingInvoices = invoiceRepository.countByStatus(InvoiceStatus.ISSUED)
                + invoiceRepository.countByStatus(InvoiceStatus.PARTIALLY_PAID)
                + invoiceRepository.countByStatus(InvoiceStatus.OVERDUE);

        BigDecimal totalRevenue = invoiceRepository.sumTotalPaidAmount();
        BigDecimal pendingPayments = invoiceRepository.sumOutstandingAmount();

        return new DashboardSummaryDto(
                totalOrders,
                pendingOrders,
                inProduction,
                completedOrders,
                lowStockCount,
                totalPOs,
                outstandingInvoices,
                totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
                pendingPayments != null ? pendingPayments : BigDecimal.ZERO,
                materialRepository.findLowStockMaterials(),
                salesOrderRepository.findRecentOrders(PageRequest.of(0, 5))
        );
    }
}
