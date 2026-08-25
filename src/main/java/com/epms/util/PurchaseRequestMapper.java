package com.epms.util;

import com.epms.dto.DeliveryAddressResponse;
import com.epms.dto.PurchaseRequestItemResponse;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.entity.DeliveryAddress;
import com.epms.entity.PurchaseRequest;

import java.util.List;

public class PurchaseRequestMapper {

    private PurchaseRequestMapper() {
    }

    public static PurchaseRequestResponse toResponse(
            PurchaseRequest request) {

        List<PurchaseRequestItemResponse> items =
                request.getItems()
                        .stream()
                        .map(item -> new PurchaseRequestItemResponse(
                                item.getProduct().getId(),
                                item.getProduct().getName(),
                                item.getQuantity()
                        ))
                        .toList();

        DeliveryAddressResponse deliveryAddressResponse = null;

        DeliveryAddress address =
                request.getDeliveryAddress();

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

        return new PurchaseRequestResponse(
                request.getId(),
                request.getUser().getFullName(),
                request.getStatus(),
                request.getRequestDate(),
                items,
                deliveryAddressResponse
        );
    }
}