package com.ordercraft.service;

import com.ordercraft.dto.PaymentRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.PaymentRepository;
import com.ordercraft.repository.SalesOrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          InvoiceRepository invoiceRepository,
                          SalesOrderRepository salesOrderRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @Transactional(readOnly = true)
    public Page<Payment> getAllPayments(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return paymentRepository.searchPayments(search.trim(), pageable);
        }
        return paymentRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public Payment recordPayment(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Invoice is already fully paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException("Cannot accept payment for a cancelled invoice");
        }

        BigDecimal remaining = invoice.getRemainingAmount();
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BusinessException("Payment amount (" + request.getAmount() +
                    ") exceeds remaining invoice balance (" + remaining + ")");
        }

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(request.getAmount());
        invoice.setPaidAmount(newPaidAmount);

        SalesOrder salesOrder = invoice.getSalesOrder();

        if (newPaidAmount.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            salesOrder.setStatus(OrderStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            salesOrder.setStatus(OrderStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);
        salesOrderRepository.save(salesOrder);

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(request.getTransactionReference());
        payment.setNotes(request.getNotes());
        payment.setCreatedAt(LocalDateTime.now());

        return paymentRepository.save(payment);
    }
}
