package com.epms.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateDeliveryRequest {

    @NotNull(message = "Purchase request ID is required")
    private Long purchaseRequestId;

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private LocalDate estimatedDeliveryDate;

    public CreateDeliveryRequest() {
    }

    public CreateDeliveryRequest(
            Long purchaseRequestId,
            Long supplierId,
            LocalDate estimatedDeliveryDate) {

        this.purchaseRequestId = purchaseRequestId;
        this.supplierId = supplierId;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public void setPurchaseRequestId(Long purchaseRequestId) {
        this.purchaseRequestId = purchaseRequestId;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public LocalDate getEstimatedDeliveryDate() {
        return estimatedDeliveryDate;
    }

    public void setEstimatedDeliveryDate(
            LocalDate estimatedDeliveryDate) {

        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }
}