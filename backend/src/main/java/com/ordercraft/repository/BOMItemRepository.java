package com.ordercraft.repository;

import com.ordercraft.entity.BOMItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BOMItemRepository extends JpaRepository<BOMItem, Long> {
    List<BOMItem> findByBomId(Long bomId);
    void deleteByBomId(Long bomId);
}
