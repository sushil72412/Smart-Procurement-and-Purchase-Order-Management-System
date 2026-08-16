package com.epms.service.impl;

import com.epms.dto.CreateSupplierRequest;
import com.epms.dto.SupplierResponse;
import com.epms.entity.Supplier;
import com.epms.entity.User;
import com.epms.enums.Role;
import com.epms.repository.SupplierRepository;
import com.epms.repository.UserRepository;
import com.epms.service.SupplierService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public SupplierServiceImpl(
            SupplierRepository supplierRepository,
            UserRepository userRepository) {

        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SupplierResponse createSupplier(CreateSupplierRequest request) {

        // Find existing user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found."));

        // User must have SUPPLIER role
        if (user.getRole() != Role.SUPPLIER) {
            throw new RuntimeException(
                    "User must have SUPPLIER role.");
        }

        // One supplier profile per user
        if (supplierRepository.existsByUserId(user.getId())) {
            throw new RuntimeException(
                    "Supplier profile already exists for this user.");
        }

        // Create supplier profile
        Supplier supplier = new Supplier();

        supplier.setUser(user);
        supplier.setCompanyName(request.getCompanyName());
        supplier.setCompanyAddress(request.getCompanyAddress());
        supplier.setContactPerson(request.getContactPerson());

        // Save
        Supplier savedSupplier =
                supplierRepository.save(supplier);

        return mapToResponse(savedSupplier);
    }

    @Override
    public SupplierResponse getSupplierById(Long id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Supplier not found."));

        return mapToResponse(supplier);
    }

    @Override
    public SupplierResponse getSupplierByUserId(Long userId) {

        Supplier supplier =
                supplierRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Supplier profile not found."));

        return mapToResponse(supplier);
    }

    @Override
    public List<SupplierResponse> getAllSuppliers() {

        return supplierRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private SupplierResponse mapToResponse(Supplier supplier) {

        User user = supplier.getUser();

        return new SupplierResponse(
                supplier.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                supplier.getCompanyName(),
                supplier.getCompanyAddress(),
                supplier.getContactPerson(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
    }
}