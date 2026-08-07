package com.epms.service;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.PurchaseRequestResponse;

import java.util.List;

public interface PurchaseRequestService {

    PurchaseRequestResponse createPurchaseRequest(CreatePurchaseRequest request);

    List<PurchaseRequestResponse> getAllRequests();

    PurchaseRequestResponse approveRequest(Long requestId);

    PurchaseRequestResponse rejectRequest(Long requestId);
}