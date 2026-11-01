package com.ordercraft.service;

import com.ordercraft.entity.Customer;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public Page<Customer> getAllCustomers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return customerRepository.searchCustomers(search.trim(), pageable);
        }
        return customerRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomersList() {
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Customer createCustomer(Customer customer) {
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            throw new BusinessException("Customer name cannot be empty");
        }
        customer.setId(null);
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer updatedData) {
        Customer existing = getCustomerById(id);
        existing.setName(updatedData.getName());
        existing.setEmail(updatedData.getEmail());
        existing.setPhone(updatedData.getPhone());
        existing.setCompanyName(updatedData.getCompanyName());
        existing.setAddress(updatedData.getAddress());
        existing.setGstNumber(updatedData.getGstNumber());
        return customerRepository.save(existing);
    }

    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
    }
}
