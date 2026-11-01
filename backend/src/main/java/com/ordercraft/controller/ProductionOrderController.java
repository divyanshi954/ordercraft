package com.ordercraft.controller;

import com.ordercraft.dto.ProductionOrderRequest;
import com.ordercraft.entity.ProductionOrder;
import com.ordercraft.service.ProductionOrderService;
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
@RequestMapping("/api/production-orders")
@Tag(name = "Production Orders", description = "Production scheduling and material consumption endpoints")
public class ProductionOrderController {

    private final ProductionOrderService productionOrderService;

    public ProductionOrderController(ProductionOrderService productionOrderService) {
        this.productionOrderService = productionOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Get paginated production orders")
    public ResponseEntity<Page<ProductionOrder>> getProductionOrders(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(productionOrderService.getAllProductionOrders(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Get production order by ID")
    public ResponseEntity<ProductionOrder> getProductionOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(productionOrderService.getProductionOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Plan production order for ready sales order")
    public ResponseEntity<ProductionOrder> planProduction(@Valid @RequestBody ProductionOrderRequest request) {
        ProductionOrder created = productionOrderService.planProductionOrder(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Start production and consume reserved raw materials")
    public ResponseEntity<ProductionOrder> startProduction(@PathVariable Long id) {
        return ResponseEntity.ok(productionOrderService.startProduction(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Complete production order")
    public ResponseEntity<ProductionOrder> completeProduction(@PathVariable Long id) {
        return ResponseEntity.ok(productionOrderService.completeProduction(id));
    }
}
