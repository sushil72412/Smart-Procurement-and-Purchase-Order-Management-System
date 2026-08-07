package com.epms.controller;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.service.PurchaseRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    // Employee creates a purchase request
    @PostMapping
    public PurchaseRequestResponse createPurchaseRequest(
            @Valid @RequestBody CreatePurchaseRequest request) {

        return purchaseRequestService.createPurchaseRequest(request);
    }

    // Manager views all purchase requests
    @GetMapping
    public List<PurchaseRequestResponse> getAllRequests() {
        return purchaseRequestService.getAllRequests();
    }

    // Manager approves a request
    @PutMapping("/{id}/approve")
    public PurchaseRequestResponse approveRequest(@PathVariable Long id) {
        return purchaseRequestService.approveRequest(id);
    }

    // Manager rejects a request
    @PutMapping("/{id}/reject")
    public PurchaseRequestResponse rejectRequest(@PathVariable Long id) {
        return purchaseRequestService.rejectRequest(id);
    }
}