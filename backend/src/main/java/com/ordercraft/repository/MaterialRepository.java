package com.ordercraft.repository;

import com.ordercraft.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findByMaterialCode(String materialCode);

    boolean existsByMaterialCode(String materialCode);

    @Query("SELECT m FROM Material m WHERE " +
           "LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.materialCode) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Material> searchMaterials(@Param("query") String query, Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.currentStock <= m.reorderLevel")
    List<Material> findLowStockMaterials();

    @Query("SELECT COUNT(m) FROM Material m WHERE m.currentStock <= m.reorderLevel")
    long countLowStockMaterials();
}
