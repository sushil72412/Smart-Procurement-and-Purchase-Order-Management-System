package com.epms.service;

import com.epms.dto.CreateSupplierRequest;
import com.epms.dto.SupplierResponse;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(CreateSupplierRequest request);

    SupplierResponse getSupplierById(Long id);

    SupplierResponse getSupplierByUserId(Long userId);

    List<SupplierResponse> getAllSuppliers();
}