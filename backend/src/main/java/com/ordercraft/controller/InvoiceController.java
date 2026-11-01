package com.ordercraft.controller;

import com.ordercraft.dto.InvoiceCreateRequest;
import com.ordercraft.entity.Invoice;
import com.ordercraft.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@Tag(name = "Invoices", description = "Invoicing and tax billing endpoints")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    @Operation(summary = "Get paginated invoices")
    public ResponseEntity<Page<Invoice>> getInvoices(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    @Operation(summary = "Get invoice by ID with line items")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/sales-order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    @Operation(summary = "Get invoices by sales order ID")
    public ResponseEntity<List<Invoice>> getInvoicesBySalesOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.getInvoicesBySalesOrder(orderId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    @Operation(summary = "Generate invoice for completed sales order")
    public ResponseEntity<Invoice> generateInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        Invoice created = invoiceService.generateInvoice(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    @Operation(summary = "Cancel invoice")
    public ResponseEntity<Invoice> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }
}
