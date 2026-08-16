package com.epms.service;

import com.epms.dto.CreateDeliveryRequest;
import com.epms.dto.DeliveryResponse;
import com.epms.dto.DeliveryStatusUpdateRequest;

import java.util.List;

public interface DeliveryService {

    DeliveryResponse createDelivery(CreateDeliveryRequest request);

    DeliveryResponse getDeliveryById(Long id);

    DeliveryResponse getDeliveryByPurchaseRequestId(Long purchaseRequestId);

    List<DeliveryResponse> getAllDeliveries();

    List<DeliveryResponse> getDeliveriesBySupplier(Long supplierId);

    DeliveryResponse updateDeliveryStatus(
            Long deliveryId,
            DeliveryStatusUpdateRequest request
    );
}