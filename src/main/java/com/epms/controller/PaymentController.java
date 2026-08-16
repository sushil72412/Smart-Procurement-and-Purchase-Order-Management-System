package com.epms.controller;

import com.epms.dto.PaymentRequest;
import com.epms.dto.PaymentResponse;
import com.epms.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService) {

        this.paymentService = paymentService;
    }


    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid
            @RequestBody PaymentRequest request) {

        PaymentResponse response =
                paymentService.createPayment(request);

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // GET ALL PAYMENTS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<PaymentResponse>>
    getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments()
        );
    }


    // =========================================================
    // GET PAYMENT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse>
    getPaymentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(id)
        );
    }


    // =========================================================
    // GET PAYMENT BY PURCHASE REQUEST
    // =========================================================

    @GetMapping("/purchase-request/{purchaseRequestId}")
    public ResponseEntity<PaymentResponse>
    getPaymentByPurchaseRequestId(
            @PathVariable Long purchaseRequestId) {

        return ResponseEntity.ok(
                paymentService
                        .getPaymentByPurchaseRequestId(
                                purchaseRequestId
                        )
        );
    }
}