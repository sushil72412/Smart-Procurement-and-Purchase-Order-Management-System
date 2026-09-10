package com.epms.service.impl;

import com.epms.dto.CreateSupplierRequest;
import com.epms.dto.SupplierResponse;
import com.epms.entity.Supplier;
import com.epms.entity.User;
import com.epms.enums.Role;
import com.epms.repository.SupplierRepository;
import com.epms.repository.UserRepository;
import com.epms.service.SupplierService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // =========================================================
    // CREATE SUPPLIER
    // =========================================================

    @Override
    public SupplierResponse createSupplier(
            CreateSupplierRequest request) {

        // Only ADMIN can create supplier profiles
        Role currentRole = getCurrentUserRole();

        if (currentRole != Role.ADMIN) {
            throw new RuntimeException(
                    "Only admins can create supplier profiles."
            );
        }

        // Find existing user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found."
                        ));

        // User must have SUPPLIER role
        if (user.getRole() != Role.SUPPLIER) {
            throw new RuntimeException(
                    "User must have SUPPLIER role."
            );
        }

        // One supplier profile per user
        if (supplierRepository.existsByUserId(user.getId())) {
            throw new RuntimeException(
                    "Supplier profile already exists for this user."
            );
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

    // =========================================================
    // GET SUPPLIER BY ID
    // =========================================================

    @Override
    public SupplierResponse getSupplierById(Long id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found."
                        ));

        validateSupplierAccess(supplier);

        return mapToResponse(supplier);
    }

    // =========================================================
    // GET SUPPLIER BY USER ID
    // =========================================================

    @Override
    public SupplierResponse getSupplierByUserId(
            Long userId) {

        Supplier supplier =
                supplierRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Supplier profile not found."
                                ));

        validateSupplierAccess(supplier);

        return mapToResponse(supplier);
    }

    // =========================================================
    // GET ALL SUPPLIERS
    // =========================================================

    @Override
    public List<SupplierResponse> getAllSuppliers() {

        Role currentRole = getCurrentUserRole();

        // Only ADMIN and MANAGER can view all suppliers
        if (currentRole != Role.ADMIN
                && currentRole != Role.MANAGER) {

            throw new RuntimeException(
                    "Only admins and managers can view all suppliers."
            );
        }

        return supplierRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // =========================================================
    // SUPPLIER ACCESS VALIDATION
    // =========================================================

    private void validateSupplierAccess(
            Supplier supplier) {

        Role currentRole = getCurrentUserRole();

        // ADMIN and MANAGER can view any supplier
        if (currentRole == Role.ADMIN
                || currentRole == Role.MANAGER) {

            return;
        }

        // SUPPLIER can view only their own profile
        if (currentRole == Role.SUPPLIER) {

            String currentUserEmail =
                    getCurrentUserEmail();

            String supplierEmail =
                    supplier.getUser().getEmail();

            if (!supplierEmail.equalsIgnoreCase(
                    currentUserEmail)) {

                throw new RuntimeException(
                        "You can only view your own supplier profile."
                );
            }

            return;
        }

        throw new RuntimeException(
                "You are not authorized to view this supplier."
        );
    }

    // =========================================================
    // GET CURRENT USER ROLE
    // =========================================================

    private Role getCurrentUserRole() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated."
            );
        }

        if (authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_ADMIN"))) {

            return Role.ADMIN;
        }

        if (authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_MANAGER"))) {

            return Role.MANAGER;
        }

        if (authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_SUPPLIER"))) {

            return Role.SUPPLIER;
        }

        if (authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_EMPLOYEE"))) {

            return Role.EMPLOYEE;
        }

        throw new RuntimeException(
                "Invalid user role."
        );
    }

    // =========================================================
    // GET CURRENT USER EMAIL
    // =========================================================

    private String getCurrentUserEmail() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated."
            );
        }

        return authentication.getName();
    }

    // =========================================================
    // ENTITY -> RESPONSE
    // =========================================================

    private SupplierResponse mapToResponse(
            Supplier supplier) {

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