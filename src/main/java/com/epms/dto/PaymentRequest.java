package com.epms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PaymentRequest {

    @NotNull(message = "Purchase request ID is required")
    private Long purchaseRequestId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;


    public PaymentRequest() {
    }


    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public void setPurchaseRequestId(
            Long purchaseRequestId) {

        this.purchaseRequestId = purchaseRequestId;
    }


    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            String paymentMethod) {

        this.paymentMethod = paymentMethod;
    }
}
