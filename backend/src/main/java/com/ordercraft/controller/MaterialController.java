package com.ordercraft.controller;

import com.ordercraft.entity.Material;
import com.ordercraft.service.MaterialService;
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
@RequestMapping("/api/materials")
@Tag(name = "Materials", description = "Raw material and inventory management endpoints")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get paginated raw materials")
    public ResponseEntity<Page<Material>> getMaterials(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(materialService.getAllMaterials(search, pageable));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get all raw materials list")
    public ResponseEntity<List<Material>> getAllMaterialsList() {
        return ResponseEntity.ok(materialService.getAllMaterialsList());
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get low-stock materials alert list")
    public ResponseEntity<List<Material>> getLowStockMaterials() {
        return ResponseEntity.ok(materialService.getLowStockMaterials());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION', 'SALES')")
    @Operation(summary = "Get material by ID")
    public ResponseEntity<Material> getMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(materialService.getMaterialById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION')")
    @Operation(summary = "Create raw material")
    public ResponseEntity<Material> createMaterial(@Valid @RequestBody Material material) {
        Material created = materialService.createMaterial(material);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE', 'PRODUCTION')")
    @Operation(summary = "Update raw material")
    public ResponseEntity<Material> updateMaterial(@PathVariable Long id, @Valid @RequestBody Material material) {
        return ResponseEntity.ok(materialService.updateMaterial(id, material));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete raw material")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }
}
