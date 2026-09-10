package com.epms.service.impl;

import com.epms.dto.DeliveryAddressResponse;
import com.epms.dto.CreateDeliveryRequest;
import com.epms.dto.DeliveryResponse;
import com.epms.dto.DeliveryStatusUpdateRequest;
import com.epms.entity.Delivery;
import com.epms.entity.DeliveryAddress;
import com.epms.entity.PurchaseRequest;
import com.epms.entity.Supplier;
import com.epms.entity.User;
import com.epms.enums.DeliveryStatus;
import com.epms.enums.PurchaseStatus;
import com.epms.enums.Role;
import com.epms.repository.DeliveryRepository;
import com.epms.repository.PurchaseRequestRepository;
import com.epms.repository.SupplierRepository;
import com.epms.service.DeliveryService;
import com.epms.service.EmailService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final SupplierRepository supplierRepository;
    private final EmailService emailService;

    public DeliveryServiceImpl(
            DeliveryRepository deliveryRepository,
            PurchaseRequestRepository purchaseRequestRepository,
            SupplierRepository supplierRepository,
            EmailService emailService) {

        this.deliveryRepository = deliveryRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.supplierRepository = supplierRepository;
        this.emailService = emailService;
    }

    // =========================================================
    // CREATE DELIVERY
    // =========================================================

    @Override
    public DeliveryResponse createDelivery(
            CreateDeliveryRequest request) {

        // Only ADMIN and MANAGER can create deliveries
        Role role = getCurrentUserRole();

        if (role != Role.ADMIN && role != Role.MANAGER) {
            throw new RuntimeException(
                    "Only admins and managers can create deliveries."
            );
        }

        // 1. Find purchase request
        PurchaseRequest purchaseRequest =
                purchaseRequestRepository.findById(
                        request.getPurchaseRequestId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Purchase request not found."
                        ));

        // 2. Purchase request must be APPROVED
        if (purchaseRequest.getStatus()
                != PurchaseStatus.APPROVED) {

            throw new RuntimeException(
                    "Delivery can only be created for an APPROVED purchase request."
            );
        }

        // 3. Prevent duplicate delivery
        if (deliveryRepository.existsByPurchaseRequestId(
                purchaseRequest.getId())) {

            throw new RuntimeException(
                    "Delivery already exists for this purchase request."
            );
        }

        // 4. Find supplier
        Supplier supplier =
                supplierRepository.findById(
                        request.getSupplierId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found."
                        ));

        // 5. Verify supplier's user role
        User supplierUser = supplier.getUser();

        if (supplierUser.getRole() != Role.SUPPLIER) {

            throw new RuntimeException(
                    "Selected user is not a supplier."
            );
        }

        // 6. Create delivery
        Delivery delivery = new Delivery();

        delivery.setPurchaseRequest(purchaseRequest);
        delivery.setSupplier(supplier);

        delivery.setEstimatedDeliveryDate(
                request.getEstimatedDeliveryDate()
        );

        // Initial status
        delivery.setStatus(
                DeliveryStatus.ORDER_CONFIRMED
        );

        // 7. Generate tracking number
        delivery.setTrackingNumber(
                generateTrackingNumber()
        );

        // 8. Save delivery
        Delivery savedDelivery =
                deliveryRepository.save(delivery);

        return mapToResponse(savedDelivery);
    }

    // =========================================================
    // GET DELIVERY BY ID
    // =========================================================

    @Override
    public DeliveryResponse getDeliveryById(Long id) {

        Delivery delivery =
                deliveryRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found."
                                ));

        validateDeliveryViewAccess(delivery);

        return mapToResponse(delivery);
    }

    // =========================================================
    // GET DELIVERY BY PURCHASE REQUEST
    // =========================================================

    @Override
    public DeliveryResponse getDeliveryByPurchaseRequestId(
            Long purchaseRequestId) {

        Delivery delivery =
                deliveryRepository
                        .findByPurchaseRequestId(
                                purchaseRequestId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found for this purchase request."
                                ));

        validateDeliveryViewAccess(delivery);

        return mapToResponse(delivery);
    }

    // =========================================================
    // GET ALL DELIVERIES
    // =========================================================

    @Override
    public List<DeliveryResponse> getAllDeliveries() {

        Role role = getCurrentUserRole();

        // Only ADMIN and MANAGER can view all deliveries
        if (role != Role.ADMIN && role != Role.MANAGER) {

            throw new RuntimeException(
                    "Only admins and managers can view all deliveries."
            );
        }

        return deliveryRepository.findAllWithDetails()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // =========================================================
    // GET DELIVERIES BY SUPPLIER
    // =========================================================

    @Override
    public List<DeliveryResponse> getDeliveriesBySupplier(
            Long supplierId) {

        Supplier supplier =
                supplierRepository.findById(supplierId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Supplier not found."
                                ));

        Role role = getCurrentUserRole();

        // ADMIN and MANAGER can view any supplier's deliveries
        if (role == Role.ADMIN || role == Role.MANAGER) {

            return deliveryRepository
                    .findBySupplierId(supplierId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        // SUPPLIER can view only their own deliveries
        if (role == Role.SUPPLIER) {

            String currentUserEmail =
                    getCurrentUserEmail();

            String supplierEmail =
                    supplier.getUser().getEmail();

            if (!supplierEmail.equalsIgnoreCase(
                    currentUserEmail)) {

                throw new RuntimeException(
                        "You can only view your own deliveries."
                );
            }

            return deliveryRepository
                    .findBySupplierId(supplierId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        // EMPLOYEE is not allowed to use supplier endpoint
        throw new RuntimeException(
                "You are not authorized to view supplier deliveries."
        );
    }

    // =========================================================
    // UPDATE DELIVERY STATUS
    // =========================================================

    @Override
    public DeliveryResponse updateDeliveryStatus(
            Long deliveryId,
            DeliveryStatusUpdateRequest request) {

        // 1. Find delivery
        Delivery delivery =
                deliveryRepository.findById(deliveryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found."
                                ));

        // 2. Check authorization
        validateDeliveryUpdateAccess(delivery);

        // 3. Validate status transition
        DeliveryStatus currentStatus =
                delivery.getStatus();

        DeliveryStatus newStatus =
                request.getStatus();

        validateStatusTransition(
                currentStatus,
                newStatus
        );

        // 4. Update timestamps
        LocalDateTime now =
                LocalDateTime.now();

        if (newStatus == DeliveryStatus.SHIPPED) {

            delivery.setShippedAt(now);
        }

        if (newStatus == DeliveryStatus.OUT_FOR_DELIVERY) {

            delivery.setOutForDeliveryAt(now);
        }

        if (newStatus == DeliveryStatus.DELIVERED) {

            delivery.setDeliveredAt(now);
        }

        // 5. Update status
        delivery.setStatus(newStatus);

        // 6. Save delivery
        Delivery updatedDelivery =
                deliveryRepository.save(delivery);

        // 7. Notify employee
        sendDeliveryStatusEmail(updatedDelivery);

        return mapToResponse(updatedDelivery);
    }

    // =========================================================
    // DELIVERY STATUS TRANSITION VALIDATION
    // =========================================================

    private void validateStatusTransition(
            DeliveryStatus currentStatus,
            DeliveryStatus newStatus) {

        if (currentStatus == DeliveryStatus.ORDER_CONFIRMED
                && newStatus == DeliveryStatus.PREPARING) {

            return;
        }

        if (currentStatus == DeliveryStatus.PREPARING
                && newStatus == DeliveryStatus.SHIPPED) {

            return;
        }

        if (currentStatus == DeliveryStatus.SHIPPED
                && newStatus == DeliveryStatus.OUT_FOR_DELIVERY) {

            return;
        }

        if (currentStatus == DeliveryStatus.OUT_FOR_DELIVERY
                && newStatus == DeliveryStatus.DELIVERED) {

            return;
        }

        if (newStatus == DeliveryStatus.FAILED) {

            return;
        }

        throw new RuntimeException(
                "Invalid delivery status transition: "
                        + currentStatus
                        + " -> "
                        + newStatus
        );
    }

    // =========================================================
    // GENERATE TRACKING NUMBER
    // =========================================================

    private String generateTrackingNumber() {

        return "EPMS-"
                + System.currentTimeMillis();
    }

    // =========================================================
    // SEND DELIVERY STATUS EMAIL
    // =========================================================

    private void sendDeliveryStatusEmail(
            Delivery delivery) {

        User employee =
                delivery.getPurchaseRequest().getUser();

        String status =
                delivery.getStatus().name();

        String subject =
                "Purchase Request Delivery Update";

        String body =
                "Hello "
                        + employee.getFullName()
                        + ",\n\n"
                        + "There is an update on your purchase request."
                        + "\n\n"
                        + "Purchase Request ID: "
                        + delivery.getPurchaseRequest().getId()
                        + "\n"
                        + "Tracking Number: "
                        + delivery.getTrackingNumber()
                        + "\n"
                        + "Status: "
                        + status
                        + "\n"
                        + "Estimated Delivery: "
                        + delivery.getEstimatedDeliveryDate()
                        + "\n\n"
                        + "You will receive another notification "
                        + "when the delivery status changes."
                        + "\n\n"
                        + "Enterprise Procurement System";

        emailService.sendEmail(
                employee.getEmail(),
                subject,
                body
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
    // DELIVERY VIEW AUTHORIZATION
    // =========================================================

    private void validateDeliveryViewAccess(
            Delivery delivery) {

        Role role = getCurrentUserRole();

        // ADMIN and MANAGER can view all deliveries
        if (role == Role.ADMIN || role == Role.MANAGER) {
            return;
        }

        String currentUserEmail =
                getCurrentUserEmail();

        // SUPPLIER can view only their own deliveries
        if (role == Role.SUPPLIER) {

            String supplierEmail =
                    delivery.getSupplier()
                            .getUser()
                            .getEmail();

            if (!supplierEmail.equalsIgnoreCase(
                    currentUserEmail)) {

                throw new RuntimeException(
                        "You can only view your own deliveries."
                );
            }

            return;
        }

        // EMPLOYEE can view only their own deliveries
        if (role == Role.EMPLOYEE) {

            String employeeEmail =
                    delivery.getPurchaseRequest()
                            .getUser()
                            .getEmail();

            if (!employeeEmail.equalsIgnoreCase(
                    currentUserEmail)) {

                throw new RuntimeException(
                        "You can only view your own deliveries."
                );
            }

            return;
        }

        throw new RuntimeException(
                "You are not authorized to view this delivery."
        );
    }

    // =========================================================
    // DELIVERY UPDATE AUTHORIZATION
    // =========================================================

    private void validateDeliveryUpdateAccess(
            Delivery delivery) {

        Role role = getCurrentUserRole();

        // ADMIN and MANAGER can update any delivery
        if (role == Role.ADMIN || role == Role.MANAGER) {
            return;
        }

        // SUPPLIER can update only their own deliveries
        if (role == Role.SUPPLIER) {

            String currentUserEmail =
                    getCurrentUserEmail();

            String supplierEmail =
                    delivery.getSupplier()
                            .getUser()
                            .getEmail();

            if (!supplierEmail.equalsIgnoreCase(
                    currentUserEmail)) {

                throw new RuntimeException(
                        "You can only update your own deliveries."
                );
            }

            return;
        }

        // EMPLOYEE cannot update delivery status
        throw new RuntimeException(
                "Employees cannot update delivery status."
        );
    }

    // =========================================================
    // MAP ENTITY TO RESPONSE
    // =========================================================

    private DeliveryResponse mapToResponse(
            Delivery delivery) {

        Supplier supplier =
                delivery.getSupplier();

        User supplierUser =
                supplier.getUser();

        // Get delivery address from purchase request
        DeliveryAddress address =
                delivery.getPurchaseRequest()
                        .getDeliveryAddress();

        DeliveryAddressResponse deliveryAddressResponse = null;

        if (address != null) {

            deliveryAddressResponse =
                    new DeliveryAddressResponse(
                            address.getId(),
                            address.getRecipientName(),
                            address.getPhone(),
                            address.getAddressLine1(),
                            address.getAddressLine2(),
                            address.getCity(),
                            address.getState(),
                            address.getPostalCode(),
                            address.getCountry()
                    );
        }

        return new DeliveryResponse(
                delivery.getId(),
                delivery.getPurchaseRequest().getId(),
                supplier.getId(),
                supplierUser.getFullName(),
                supplierUser.getEmail(),
                delivery.getTrackingNumber(),
                delivery.getStatus(),
                delivery.getEstimatedDeliveryDate(),
                delivery.getShippedAt(),
                delivery.getOutForDeliveryAt(),
                delivery.getDeliveredAt(),
                delivery.getCreatedAt(),
                delivery.getUpdatedAt(),
                deliveryAddressResponse
        );
    }
}