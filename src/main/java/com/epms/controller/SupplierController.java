package com.epms.controller;

import com.epms.dto.CreateSupplierRequest;
import com.epms.dto.SupplierResponse;
import com.epms.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public SupplierResponse createSupplier(
            @Valid @RequestBody CreateSupplierRequest request) {

        return supplierService.createSupplier(request);
    }

    @GetMapping
    public List<SupplierResponse> getAllSuppliers() {

        return supplierService.getAllSuppliers();
    }

    @GetMapping("/{id}")
    public SupplierResponse getSupplierById(
            @PathVariable Long id) {

        return supplierService.getSupplierById(id);
    }

    @GetMapping("/user/{userId}")
    public SupplierResponse getSupplierByUserId(
            @PathVariable Long userId) {

        return supplierService.getSupplierByUserId(userId);
    }
}