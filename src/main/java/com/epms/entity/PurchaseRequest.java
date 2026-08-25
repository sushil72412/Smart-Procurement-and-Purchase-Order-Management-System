package com.epms.entity;

import com.epms.enums.PurchaseStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Employee who created the request
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // One Purchase Request can have many items
    @OneToMany(
            mappedBy = "purchaseRequest",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PurchaseRequestItem> items = new ArrayList<>();

    // Delivery address for this purchase request
    @OneToOne(
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            optional = false
    )
    @JoinColumn(
            name = "delivery_address_id",
            nullable = false,
            unique = true
    )
    private DeliveryAddress deliveryAddress;

    @Enumerated(EnumType.STRING)
    private PurchaseStatus status;

    private LocalDateTime requestDate;

    public PurchaseRequest() {
    }

    @PrePersist
    public void onCreate() {

        requestDate = LocalDateTime.now();

        if (status == null) {
            status = PurchaseStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<PurchaseRequestItem> getItems() {
        return items;
    }

    public void setItems(List<PurchaseRequestItem> items) {
        this.items = items;
    }

    public DeliveryAddress getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(
            DeliveryAddress deliveryAddress) {

        this.deliveryAddress = deliveryAddress;
    }

    public PurchaseStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestDate() {
        return requestDate;
    }
}