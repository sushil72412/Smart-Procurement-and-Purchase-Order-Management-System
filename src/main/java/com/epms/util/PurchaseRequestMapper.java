package com.epms.util;

import com.epms.dto.PurchaseRequestItemResponse;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.entity.PurchaseRequest;

import java.util.List;

public class PurchaseRequestMapper {

    private PurchaseRequestMapper() {
    }

    public static PurchaseRequestResponse toResponse(PurchaseRequest request) {

        List<PurchaseRequestItemResponse> items = request.getItems()
                .stream()
                .map(item -> new PurchaseRequestItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity()
                ))
                .toList();

        return new PurchaseRequestResponse(
                request.getId(),
                request.getUser().getFullName(),
                request.getStatus(),
                request.getRequestDate(),
                items
        );
    }
}