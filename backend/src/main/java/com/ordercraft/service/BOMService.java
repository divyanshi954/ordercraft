package com.ordercraft.service;

import com.ordercraft.dto.BOMItemRequest;
import com.ordercraft.dto.BOMRequest;
import com.ordercraft.entity.BOM;
import com.ordercraft.entity.BOMItem;
import com.ordercraft.entity.Material;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.BOMItemRepository;
import com.ordercraft.repository.BOMRepository;
import com.ordercraft.repository.MaterialRepository;
import com.ordercraft.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BOMService {

    private final BOMRepository bomRepository;
    private final BOMItemRepository bomItemRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;

    public BOMService(BOMRepository bomRepository,
                      BOMItemRepository bomItemRepository,
                      ProductRepository productRepository,
                      MaterialRepository materialRepository) {
        this.bomRepository = bomRepository;
        this.bomItemRepository = bomItemRepository;
        this.productRepository = productRepository;
        this.materialRepository = materialRepository;
    }

    @Transactional(readOnly = true)
    public List<BOM> getAllBOMs() {
        return bomRepository.findAllWithItems();
    }

    @Transactional(readOnly = true)
    public BOM getBOMById(Long id) {
        return bomRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public BOM getActiveBOMByProductId(Long productId) {
        return bomRepository.findActiveBomWithItemsByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("No active BOM found for product id: " + productId));
    }

    public BOM createBOM(BOMRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (Boolean.TRUE.equals(request.getActive())) {
            // Deactivate any existing active BOM for this product
            bomRepository.findByProductIdAndActiveTrue(product.getId())
                    .ifPresent(existingBom -> {
                        existingBom.setActive(false);
                        bomRepository.save(existingBom);
                    });
        }

        BOM bom = new BOM();
        bom.setProduct(product);
        bom.setVersion(request.getVersion() != null ? request.getVersion() : "v1.0");
        bom.setActive(request.getActive() != null ? request.getActive() : true);

        for (BOMItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findById(itemReq.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + itemReq.getMaterialId()));
            bom.addItem(new BOMItem(null, bom, material, itemReq.getQuantityRequired()));
        }

        return bomRepository.save(bom);
    }

    public BOM updateBOM(Long id, BOMRequest request) {
        BOM bom = getBOMById(id);

        if (Boolean.TRUE.equals(request.getActive()) && !Boolean.TRUE.equals(bom.getActive())) {
            bomRepository.findByProductIdAndActiveTrue(bom.getProduct().getId())
                    .ifPresent(existingBom -> {
                        if (!existingBom.getId().equals(bom.getId())) {
                            existingBom.setActive(false);
                            bomRepository.save(existingBom);
                        }
                    });
        }

        bom.setVersion(request.getVersion() != null ? request.getVersion() : bom.getVersion());
        bom.setActive(request.getActive() != null ? request.getActive() : bom.getActive());

        bom.getItems().clear();
        for (BOMItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findById(itemReq.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + itemReq.getMaterialId()));
            bom.addItem(new BOMItem(null, bom, material, itemReq.getQuantityRequired()));
        }

        return bomRepository.save(bom);
    }

    public void deleteBOM(Long id) {
        BOM bom = getBOMById(id);
        bomRepository.delete(bom);
    }
}
