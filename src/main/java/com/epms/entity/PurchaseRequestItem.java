package com.epms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "purchase_request_items")
public class PurchaseRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Parent Purchase Request
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    // Requested Product
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Quantity Requested
    @Column(nullable = false)
    private Integer quantity;

    public PurchaseRequestItem() {
    }

    public PurchaseRequestItem(Long id,
                               PurchaseRequest purchaseRequest,
                               Product product,
                               Integer quantity) {
        this.id = id;
        this.purchaseRequest = purchaseRequest;
        this.product = product;
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public void setPurchaseRequest(PurchaseRequest purchaseRequest) {
        this.purchaseRequest = purchaseRequest;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}