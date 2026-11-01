package com.ordercraft.service;

import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return productRepository.searchProducts(search.trim(), pageable);
        }
        return productRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProductsList() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public Product createProduct(Product product) {
        if (productRepository.existsByProductCode(product.getProductCode())) {
            throw new BusinessException("Product code already exists: " + product.getProductCode());
        }
        product.setId(null);
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product updatedData) {
        Product existing = getProductById(id);
        if (!existing.getProductCode().equals(updatedData.getProductCode()) &&
            productRepository.existsByProductCode(updatedData.getProductCode())) {
            throw new BusinessException("Product code already exists: " + updatedData.getProductCode());
        }
        existing.setProductCode(updatedData.getProductCode());
        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setCategory(updatedData.getCategory());
        existing.setUnitPrice(updatedData.getUnitPrice());
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
