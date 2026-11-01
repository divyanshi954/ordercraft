package com.ordercraft.controller;

import com.ordercraft.dto.BOMRequest;
import com.ordercraft.entity.BOM;
import com.ordercraft.service.BOMService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boms")
@Tag(name = "Bill of Materials", description = "BOM management endpoints")
public class BOMController {

    private final BOMService bomService;

    public BOMController(BOMService bomService) {
        this.bomService = bomService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get all BOMs")
    public ResponseEntity<List<BOM>> getAllBOMs() {
        return ResponseEntity.ok(bomService.getAllBOMs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get BOM by ID with items")
    public ResponseEntity<BOM> getBOMById(@PathVariable Long id) {
        return ResponseEntity.ok(bomService.getBOMById(id));
    }

    @GetMapping("/product/{productId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get active BOM for a product")
    public ResponseEntity<BOM> getActiveBOMForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(bomService.getActiveBOMByProductId(productId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Create new BOM")
    public ResponseEntity<BOM> createBOM(@Valid @RequestBody BOMRequest request) {
        BOM created = bomService.createBOM(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    @Operation(summary = "Update BOM")
    public ResponseEntity<BOM> updateBOM(@PathVariable Long id, @Valid @RequestBody BOMRequest request) {
        return ResponseEntity.ok(bomService.updateBOM(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete BOM")
    public ResponseEntity<Void> deleteBOM(@PathVariable Long id) {
        bomService.deleteBOM(id);
        return ResponseEntity.noContent().build();
    }
}
