package com.epms.entity;

import com.epms.enums.PaymentStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // PURCHASE REQUEST
    // =========================================================

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "purchase_request_id",
            nullable = false,
            unique = true
    )
    private PurchaseRequest purchaseRequest;


    // =========================================================
    // PAYMENT AMOUNT
    // =========================================================

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal amount;


    // =========================================================
    // PAYMENT STATUS
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;


    // =========================================================
    // PAYMENT METHOD
    // =========================================================

    @Column(name = "payment_method")
    private String paymentMethod;


    // =========================================================
    // TRANSACTION ID
    // =========================================================

    @Column(
            name = "transaction_id",
            unique = true
    )
    private String transactionId;


    // =========================================================
    // CREATED / UPDATED
    // =========================================================

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Payment() {
    }


    // =========================================================
    // PRE-PERSIST
    // =========================================================

    @PrePersist
    public void onCreate() {

        createdAt = LocalDateTime.now();

        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }


    // =========================================================
    // PRE-UPDATE
    // =========================================================

    @PreUpdate
    public void onUpdate() {

        updatedAt = LocalDateTime.now();
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public void setPurchaseRequest(
            PurchaseRequest purchaseRequest) {

        this.purchaseRequest = purchaseRequest;
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

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }


    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }


    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
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