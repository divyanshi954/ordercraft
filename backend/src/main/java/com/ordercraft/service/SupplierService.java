package com.ordercraft.service;

import com.ordercraft.entity.Supplier;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public Page<Supplier> getAllSuppliers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return supplierRepository.searchSuppliers(search.trim(), pageable);
        }
        return supplierRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliersList() {
        return supplierRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().trim().isEmpty()) {
            throw new BusinessException("Supplier name cannot be empty");
        }
        supplier.setId(null);
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier updatedData) {
        Supplier existing = getSupplierById(id);
        existing.setName(updatedData.getName());
        existing.setEmail(updatedData.getEmail());
        existing.setPhone(updatedData.getPhone());
        existing.setCompanyName(updatedData.getCompanyName());
        existing.setAddress(updatedData.getAddress());
        return supplierRepository.save(existing);
    }

    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        supplierRepository.delete(supplier);
    }
}
