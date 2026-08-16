package com.epms.controller;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.PurchaseRequestActionRequest;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.service.PurchaseRequestExportService;
import com.epms.service.PurchaseRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    private final PurchaseRequestExportService
            purchaseRequestExportService;

    public PurchaseRequestController(
            PurchaseRequestService purchaseRequestService,
            PurchaseRequestExportService
                    purchaseRequestExportService) {

        this.purchaseRequestService =
                purchaseRequestService;

        this.purchaseRequestExportService =
                purchaseRequestExportService;
    }


    // CREATE PURCHASE REQUEST

    @PostMapping
    public PurchaseRequestResponse createPurchaseRequest(
            @Valid
            @RequestBody
            CreatePurchaseRequest request) {

        return purchaseRequestService
                .createPurchaseRequest(request);
    }

    // GET ALL PURCHASE REQUESTS

    @GetMapping
    public List<PurchaseRequestResponse>
    getAllPurchaseRequests() {

        return purchaseRequestService
                .getAllPurchaseRequests();
    }


    // DOWNLOAD PURCHASE REQUESTS AS CSV

    @GetMapping("/export")
    public ResponseEntity<byte[]>
    exportPurchaseRequests() {

        byte[] csv =
                purchaseRequestExportService
                        .exportPurchaseRequests();

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=purchase-requests.csv"
                )
                .contentType(
                        MediaType.parseMediaType(
                                "text/csv"
                        )
                )
                .body(csv);
    }


    // GET PURCHASE REQUEST BY ID

    @GetMapping("/{id}")
    public PurchaseRequestResponse
    getPurchaseRequestById(
            @PathVariable Long id) {

        return purchaseRequestService
                .getPurchaseRequestById(id);
    }


    // UNIFIED PURCHASE REQUEST ACTION

    /*
       APPROVE:

       PATCH /api/purchase-requests/1

       {
           "action": "APPROVE"
       }


       REJECT:

       PATCH /api/purchase-requests/1

       {
           "action": "REJECT"
       }
    */

    @PatchMapping("/{id}")
    public PurchaseRequestResponse
    updatePurchaseRequest(
            @PathVariable Long id,

            @Valid
            @RequestBody
            PurchaseRequestActionRequest request) {

        return purchaseRequestService
                .processRequest(
                        id,
                        request.getAction()
                );
    }
}