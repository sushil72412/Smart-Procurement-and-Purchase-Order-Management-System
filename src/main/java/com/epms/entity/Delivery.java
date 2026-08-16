package com.epms.entity;

import com.epms.enums.DeliveryStatus;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "deliveries",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_delivery_purchase_request",
                        columnNames = "purchase_request_id"
                )
        }
)
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One delivery belongs to one purchase request
    @OneToOne(optional = false)
    @JoinColumn(
            name = "purchase_request_id",
            nullable = false,
            unique = true
    )
    private PurchaseRequest purchaseRequest;

    // Supplier responsible for this delivery
    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(unique = true)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    private LocalDate estimatedDeliveryDate;

    private LocalDateTime shippedAt;

    private LocalDateTime outForDeliveryAt;

    private LocalDateTime deliveredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Delivery() {
    }

    public Delivery(
            Long id,
            PurchaseRequest purchaseRequest,
            Supplier supplier,
            String trackingNumber,
            DeliveryStatus status,
            LocalDate estimatedDeliveryDate,
            LocalDateTime shippedAt,
            LocalDateTime outForDeliveryAt,
            LocalDateTime deliveredAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.purchaseRequest = purchaseRequest;
        this.supplier = supplier;
        this.trackingNumber = trackingNumber;
        this.status = status;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
        this.shippedAt = shippedAt;
        this.outForDeliveryAt = outForDeliveryAt;
        this.deliveredAt = deliveredAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    public void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = DeliveryStatus.ORDER_CONFIRMED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public void setPurchaseRequest(PurchaseRequest purchaseRequest) {
        this.purchaseRequest = purchaseRequest;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
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