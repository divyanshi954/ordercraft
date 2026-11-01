package com.ordercraft.repository;

import com.ordercraft.entity.ProductionOrder;
import com.ordercraft.entity.ProductionOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {

    Optional<ProductionOrder> findByProductionNumber(String productionNumber);

    boolean existsByProductionNumber(String productionNumber);

    List<ProductionOrder> findBySalesOrderId(Long salesOrderId);

    List<ProductionOrder> findByStatus(ProductionOrderStatus status);

    long countByStatus(ProductionOrderStatus status);

    @Query("SELECT po FROM ProductionOrder po WHERE " +
           "LOWER(po.productionNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.salesOrder.orderNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<ProductionOrder> searchProductionOrders(@Param("query") String query, Pageable pageable);
}
