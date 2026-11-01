package com.ordercraft.service;

import com.ordercraft.entity.Material;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.MaterialRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class MaterialService {

    private final MaterialRepository materialRepository;

    public MaterialService(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    @Transactional(readOnly = true)
    public Page<Material> getAllMaterials(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return materialRepository.searchMaterials(search.trim(), pageable);
        }
        return materialRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Material> getAllMaterialsList() {
        return materialRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Material> getLowStockMaterials() {
        return materialRepository.findLowStockMaterials();
    }

    public Material createMaterial(Material material) {
        if (materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            throw new BusinessException("Material code already exists: " + material.getMaterialCode());
        }
        material.setId(null);
        if (material.getCurrentStock() == null) {
            material.setCurrentStock(BigDecimal.ZERO);
        }
        if (material.getReservedStock() == null) {
            material.setReservedStock(BigDecimal.ZERO);
        }
        if (material.getReorderLevel() == null) {
            material.setReorderLevel(BigDecimal.ZERO);
        }
        return materialRepository.save(material);
    }

    public Material updateMaterial(Long id, Material updatedData) {
        Material existing = getMaterialById(id);
        if (!existing.getMaterialCode().equals(updatedData.getMaterialCode()) &&
            materialRepository.existsByMaterialCode(updatedData.getMaterialCode())) {
            throw new BusinessException("Material code already exists: " + updatedData.getMaterialCode());
        }
        existing.setMaterialCode(updatedData.getMaterialCode());
        existing.setName(updatedData.getName());
        existing.setUnit(updatedData.getUnit());
        existing.setCurrentStock(updatedData.getCurrentStock());
        existing.setReorderLevel(updatedData.getReorderLevel());
        return materialRepository.save(existing);
    }

    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        materialRepository.delete(material);
    }

    public void addStock(Long materialId, BigDecimal quantity) {
        Material material = getMaterialById(materialId);
        material.setCurrentStock(material.getCurrentStock().add(quantity));
        materialRepository.save(material);
    }
}
