package com.epms.controller;

import com.epms.dto.CreateDeliveryRequest;
import com.epms.dto.DeliveryResponse;
import com.epms.dto.DeliveryStatusUpdateRequest;
import com.epms.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    public DeliveryResponse createDelivery(
            @Valid @RequestBody CreateDeliveryRequest request) {

        return deliveryService.createDelivery(request);
    }

    @GetMapping
    public List<DeliveryResponse> getAllDeliveries() {

        return deliveryService.getAllDeliveries();
    }

    @GetMapping("/{id}")
    public DeliveryResponse getDeliveryById(
            @PathVariable Long id) {

        return deliveryService.getDeliveryById(id);
    }

    @GetMapping("/purchase-request/{purchaseRequestId}")
    public DeliveryResponse getDeliveryByPurchaseRequestId(
            @PathVariable Long purchaseRequestId) {

        return deliveryService
                .getDeliveryByPurchaseRequestId(
                        purchaseRequestId
                );
    }

    @GetMapping("/supplier/{supplierId}")
    public List<DeliveryResponse> getDeliveriesBySupplier(
            @PathVariable Long supplierId) {

        return deliveryService
                .getDeliveriesBySupplier(supplierId);
    }

    @PatchMapping("/{id}")
    public DeliveryResponse updateDeliveryStatus(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryStatusUpdateRequest request) {

        return deliveryService.updateDeliveryStatus(
                id,
                request
        );
    }
}