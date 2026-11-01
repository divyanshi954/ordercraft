package com.ordercraft.repository;

import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    Optional<PurchaseOrder> findByPurchaseOrderNumber(String poNumber);

    boolean existsByPurchaseOrderNumber(String poNumber);

    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);

    long countByStatus(PurchaseOrderStatus status);

    List<PurchaseOrder> findBySalesOrderId(Long salesOrderId);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "LOWER(po.purchaseOrderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplier.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplier.companyName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<PurchaseOrder> searchPurchaseOrders(@Param("query") String query, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po JOIN FETCH po.items WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithItems(@Param("id") Long id);
}
