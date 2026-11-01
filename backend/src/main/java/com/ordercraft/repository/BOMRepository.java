package com.ordercraft.repository;

import com.ordercraft.entity.BOM;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BOMRepository extends JpaRepository<BOM, Long> {

    Optional<BOM> findByProductIdAndActiveTrue(Long productId);

    List<BOM> findByProductId(Long productId);

    @Query("SELECT DISTINCT b FROM BOM b LEFT JOIN FETCH b.items i LEFT JOIN FETCH i.material WHERE b.id = :id")
    Optional<BOM> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT DISTINCT b FROM BOM b LEFT JOIN FETCH b.items i LEFT JOIN FETCH i.material WHERE b.product.id = :productId AND b.active = true")
    Optional<BOM> findActiveBomWithItemsByProductId(@Param("productId") Long productId);

    @Query("SELECT DISTINCT b FROM BOM b LEFT JOIN FETCH b.items i LEFT JOIN FETCH i.material")
    List<BOM> findAllWithItems();
}
