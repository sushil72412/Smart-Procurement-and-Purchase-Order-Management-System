package com.epms.service;

import com.epms.dto.PaymentRequest;
import com.epms.dto.PaymentResponse;

import java.util.List;

public interface PaymentService {

    // Create a payment for an approved purchase request
    PaymentResponse createPayment(
            PaymentRequest request
    );

    // Get payment by ID
    PaymentResponse getPaymentById(
            Long id
    );

    // Get payment associated with a purchase request
    PaymentResponse getPaymentByPurchaseRequestId(
            Long purchaseRequestId
    );

    // Get all payments
    List<PaymentResponse> getAllPayments();
}