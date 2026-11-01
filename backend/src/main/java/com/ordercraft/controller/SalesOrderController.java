package com.ordercraft.controller;

import com.ordercraft.dto.MaterialCheckResponse;
import com.ordercraft.dto.SalesOrderRequest;
import com.ordercraft.entity.OrderStatus;
import com.ordercraft.entity.ProductionOrder;
import com.ordercraft.entity.SalesOrder;
import com.ordercraft.service.ProductionOrderService;
import com.ordercraft.service.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
@Tag(name = "Sales Orders", description = "Sales order lifecycle and material check endpoints")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;
    private final ProductionOrderService productionOrderService;

    public SalesOrderController(SalesOrderService salesOrderService,
                                ProductionOrderService productionOrderService) {
        this.salesOrderService = salesOrderService;
        this.productionOrderService = productionOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'PRODUCTION', 'ACCOUNTS')")
    @Operation(summary = "Get paginated sales orders")
    public ResponseEntity<Page<SalesOrder>> getOrders(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(salesOrderService.getAllOrders(search, pageable));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'PRODUCTION', 'ACCOUNTS')")
    @Operation(summary = "Get sales orders by status")
    public ResponseEntity<List<SalesOrder>> getOrdersByStatus(@PathVariable OrderStatus status) {
        return ResponseEntity.ok(salesOrderService.getOrdersByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'PRODUCTION', 'ACCOUNTS')")
    @Operation(summary = "Get sales order by ID with line items")
    public ResponseEntity<SalesOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Create draft sales order")
    public ResponseEntity<SalesOrder> createOrder(@Valid @RequestBody SalesOrderRequest request) {
        SalesOrder created = salesOrderService.createOrder(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Confirm sales order and trigger material check")
    public ResponseEntity<SalesOrder> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.confirmOrder(id));
    }

    @PostMapping("/{id}/check-materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'PRODUCTION')")
    @Operation(summary = "Check materials for order and reserve if available")
    public ResponseEntity<MaterialCheckResponse> checkMaterials(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.checkMaterials(id));
    }

    @GetMapping("/{id}/material-requirements")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'PRODUCTION')")
    @Operation(summary = "Preview material requirements and current shortage without state mutation")
    public ResponseEntity<MaterialCheckResponse> getMaterialRequirementsPreview(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getMaterialRequirementsPreview(id));
    }

    @PostMapping("/{id}/start-production")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Start production directly for ready sales order")
    public ResponseEntity<ProductionOrder> startProduction(@PathVariable Long id) {
        return ResponseEntity.ok(productionOrderService.createAndStartForSalesOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Cancel sales order and release any reserved materials")
    public ResponseEntity<SalesOrder> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.cancelOrder(id));
    }
}
