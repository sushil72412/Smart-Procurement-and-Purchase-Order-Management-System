package com.epms.service;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.PurchaseRequestResponse;

import java.util.List;

public interface PurchaseRequestService {

    PurchaseRequestResponse createPurchaseRequest(
            CreatePurchaseRequest request
    );

    List<PurchaseRequestResponse> getAllPurchaseRequests();

    PurchaseRequestResponse getPurchaseRequestById(
            Long id
    );

    PurchaseRequestResponse processRequest(
            Long requestId,
            String action
    );
}