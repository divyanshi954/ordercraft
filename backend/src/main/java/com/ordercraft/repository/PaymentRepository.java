package com.ordercraft.repository;

import com.ordercraft.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByInvoiceId(Long invoiceId);

    @Query("SELECT p FROM Payment p WHERE " +
           "LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.invoice.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Payment> searchPayments(@Param("query") String query, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p")
    BigDecimal sumTotalPayments();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumPaymentsByInvoiceId(@Param("invoiceId") Long invoiceId);
}
