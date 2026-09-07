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

    @Override
    public DeliveryResponse createDelivery(
            CreateDeliveryRequest request) {

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

    @Override
    public DeliveryResponse getDeliveryById(Long id) {

        Delivery delivery =
                deliveryRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found."
                                ));

        return mapToResponse(delivery);
    }

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

        return mapToResponse(delivery);
    }

    @Override
    public List<DeliveryResponse> getAllDeliveries() {

        return deliveryRepository.findAllWithDetails()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<DeliveryResponse> getDeliveriesBySupplier(
            Long supplierId) {

        if (!supplierRepository.existsById(supplierId)) {

            throw new RuntimeException(
                    "Supplier not found."
            );
        }

        return deliveryRepository
                .findBySupplierId(supplierId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

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

        DeliveryStatus currentStatus =
                delivery.getStatus();

        DeliveryStatus newStatus =
                request.getStatus();

        // 2. Validate status transition
        validateStatusTransition(
                currentStatus,
                newStatus
        );

        // 3. Update timestamps
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

        // 4. Update status
        delivery.setStatus(newStatus);

        // 5. Save delivery
        Delivery updatedDelivery =
                deliveryRepository.save(delivery);

        // 6. Notify employee
        sendDeliveryStatusEmail(updatedDelivery);

        return mapToResponse(updatedDelivery);
    }

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

    private String generateTrackingNumber() {

        return "EPMS-"
                + System.currentTimeMillis();
    }

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