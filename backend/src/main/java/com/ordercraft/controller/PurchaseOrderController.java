package com.ordercraft.controller;

import com.ordercraft.dto.PurchaseOrderRequest;
import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.service.PurchaseOrderService;
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

@RestController
@RequestMapping("/api/purchase-orders")
@Tag(name = "Purchase Orders", description = "Purchase order procurement and material receipt endpoints")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Get paginated purchase orders")
    public ResponseEntity<Page<PurchaseOrder>> getPurchaseOrders(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Get purchase order by ID with line items")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Create purchase order")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrder created = purchaseOrderService.createPurchaseOrder(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/order")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Mark purchase order as ORDERED")
    public ResponseEntity<PurchaseOrder> markOrdered(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.markOrdered(id));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Receive purchase order and increase stock")
    public ResponseEntity<PurchaseOrder> receivePurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE')")
    @Operation(summary = "Cancel purchase order")
    public ResponseEntity<PurchaseOrder> cancelPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.cancelPurchaseOrder(id));
    }
}
