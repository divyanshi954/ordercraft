package com.ordercraft.repository;

import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    List<Invoice> findBySalesOrderId(Long salesOrderId);

    List<Invoice> findByStatus(InvoiceStatus status);

    long countByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
           "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.salesOrder.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.salesOrder.customer.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Invoice> searchInvoices(@Param("query") String query, Pageable pageable);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.items WHERE i.id = :id")
    Optional<Invoice> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status != com.ordercraft.entity.InvoiceStatus.CANCELLED")
    BigDecimal sumTotalInvoicedAmount();

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM Invoice i WHERE i.status != com.ordercraft.entity.InvoiceStatus.CANCELLED")
    BigDecimal sumTotalPaidAmount();

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.paidAmount), 0) FROM Invoice i WHERE i.status IN (com.ordercraft.entity.InvoiceStatus.ISSUED, com.ordercraft.entity.InvoiceStatus.PARTIALLY_PAID, com.ordercraft.entity.InvoiceStatus.OVERDUE)")
    BigDecimal sumOutstandingAmount();
}
