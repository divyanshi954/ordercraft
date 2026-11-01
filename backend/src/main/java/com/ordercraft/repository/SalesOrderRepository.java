package com.ordercraft.repository;

import com.ordercraft.entity.OrderStatus;
import com.ordercraft.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    List<SalesOrder> findByStatus(OrderStatus status);

    long countByStatus(OrderStatus status);

    @Query("SELECT so FROM SalesOrder so WHERE " +
           "LOWER(so.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(so.customer.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(so.customer.companyName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<SalesOrder> searchOrders(@Param("query") String query, Pageable pageable);

    @Query("SELECT so FROM SalesOrder so LEFT JOIN FETCH so.items WHERE so.id = :id")
    Optional<SalesOrder> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT so FROM SalesOrder so ORDER BY so.id DESC")
    List<SalesOrder> findRecentOrders(Pageable pageable);
}
