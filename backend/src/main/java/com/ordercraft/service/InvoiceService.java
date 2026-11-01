package com.ordercraft.service;

import com.ordercraft.dto.InvoiceCreateRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.PaymentRepository;
import com.ordercraft.repository.SalesOrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PaymentRepository paymentRepository;
    private final BigDecimal taxRate;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          SalesOrderRepository salesOrderRepository,
                          PaymentRepository paymentRepository,
                          @Value("${app.tax.rate:18.0}") double taxRate) {
        this.invoiceRepository = invoiceRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.paymentRepository = paymentRepository;
        this.taxRate = BigDecimal.valueOf(taxRate);
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getAllInvoices(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return invoiceRepository.searchInvoices(search.trim(), pageable);
        }
        return invoiceRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByStatus(InvoiceStatus status) {
        return invoiceRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesBySalesOrder(Long salesOrderId) {
        return invoiceRepository.findBySalesOrderId(salesOrderId);
    }

    public Invoice generateInvoice(InvoiceCreateRequest request) {
        SalesOrder salesOrder = salesOrderRepository.findByIdWithItems(request.getSalesOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + request.getSalesOrderId()));

        if (salesOrder.getStatus() != OrderStatus.COMPLETED) {
            throw new BusinessException("Cannot generate invoice: Sales order must be COMPLETED. Current status: " + salesOrder.getStatus());
        }

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setSalesOrder(salesOrder);
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(30));
        invoice.setTaxRate(taxRate);
        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setNotes(request.getNotes());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setCreatedAt(LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (SalesOrderItem soItem : salesOrder.getItems()) {
            InvoiceItem invItem = new InvoiceItem(
                    null,
                    invoice,
                    soItem.getProduct(),
                    soItem.getQuantity(),
                    soItem.getUnitPrice(),
                    soItem.getSubtotal()
            );
            invoice.addItem(invItem);
            subtotal = subtotal.add(soItem.getSubtotal());
        }

        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);

        // Update sales order status
        salesOrder.setStatus(OrderStatus.INVOICED);
        salesOrderRepository.save(salesOrder);

        return invoiceRepository.save(invoice);
    }

    public Invoice cancelInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException("Invoice is already cancelled");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Cannot cancel an already paid invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID ||
            (invoice.getPaidAmount() != null && invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) ||
            !paymentRepository.findByInvoiceId(invoice.getId()).isEmpty()) {
            throw new BusinessException("Cannot cancel invoice " + invoice.getInvoiceNumber() +
                    ": payments have already been recorded against this invoice");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Revert Sales Order status back to COMPLETED if there are no other active invoices
        SalesOrder salesOrder = invoice.getSalesOrder();
        if (salesOrder != null) {
            List<Invoice> activeInvoices = invoiceRepository.findBySalesOrderId(salesOrder.getId()).stream()
                    .filter(inv -> !inv.getId().equals(invoice.getId()) && inv.getStatus() != InvoiceStatus.CANCELLED)
                    .toList();

            if (activeInvoices.isEmpty() && salesOrder.getStatus() == OrderStatus.INVOICED) {
                salesOrder.setStatus(OrderStatus.COMPLETED);
                salesOrderRepository.save(salesOrder);
            }
        }

        return savedInvoice;
    }

    private synchronized String generateInvoiceNumber() {
        long count = invoiceRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("INV-%d-%04d", year, count);
    }
}
