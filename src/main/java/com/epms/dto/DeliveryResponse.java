package com.epms.dto;

import com.epms.enums.DeliveryStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DeliveryResponse {

    private Long id;

    private Long purchaseRequestId;

    private Long supplierId;

    private String supplierName;

    private String supplierEmail;

    private String trackingNumber;

    private DeliveryStatus status;

    private LocalDate estimatedDeliveryDate;

    private LocalDateTime shippedAt;

    private LocalDateTime outForDeliveryAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public DeliveryResponse() {
    }

    public DeliveryResponse(
            Long id,
            Long purchaseRequestId,
            Long supplierId,
            String supplierName,
            String supplierEmail,
            String trackingNumber,
            DeliveryStatus status,
            LocalDate estimatedDeliveryDate,
            LocalDateTime shippedAt,
            LocalDateTime outForDeliveryAt,
            LocalDateTime deliveredAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.purchaseRequestId = purchaseRequestId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.supplierEmail = supplierEmail;
        this.trackingNumber = trackingNumber;
        this.status = status;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
        this.shippedAt = shippedAt;
        this.outForDeliveryAt = outForDeliveryAt;
        this.deliveredAt = deliveredAt;
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

    public void setPurchaseRequestId(Long purchaseRequestId) {
        this.purchaseRequestId = purchaseRequestId;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierEmail() {
        return supplierEmail;
    }

    public void setSupplierEmail(String supplierEmail) {
        this.supplierEmail = supplierEmail;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }

    public LocalDate getEstimatedDeliveryDate() {
        return estimatedDeliveryDate;
    }

    public void setEstimatedDeliveryDate(
            LocalDate estimatedDeliveryDate) {
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    public LocalDateTime getShippedAt() {
        return shippedAt;
    }

    public void setShippedAt(LocalDateTime shippedAt) {
        this.shippedAt = shippedAt;
    }

    public LocalDateTime getOutForDeliveryAt() {
        return outForDeliveryAt;
    }

    public void setOutForDeliveryAt(
            LocalDateTime outForDeliveryAt) {
        this.outForDeliveryAt = outForDeliveryAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}