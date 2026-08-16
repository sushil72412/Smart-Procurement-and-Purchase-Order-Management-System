package com.epms.dto;

import com.epms.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long id;

    private Long purchaseRequestId;

    private BigDecimal amount;

    private PaymentStatus status;

    private String paymentMethod;

    private String transactionId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    public PaymentResponse() {
    }


    public PaymentResponse(
            Long id,
            Long purchaseRequestId,
            BigDecimal amount,
            PaymentStatus status,
            String paymentMethod,
            String transactionId,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.purchaseRequestId =
                purchaseRequestId;
        this.amount = amount;
        this.status = status;
        this.paymentMethod =
                paymentMethod;
        this.transactionId =
                transactionId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public void setPurchaseRequestId(
            Long purchaseRequestId) {

        this.purchaseRequestId =
                purchaseRequestId;
    }


    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }


    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(
            PaymentStatus status) {

        this.status = status;
    }


    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            String paymentMethod) {

        this.paymentMethod =
                paymentMethod;
    }


    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(
            String transactionId) {

        this.transactionId =
                transactionId;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt = createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {

        this.updatedAt = updatedAt;
    }
}