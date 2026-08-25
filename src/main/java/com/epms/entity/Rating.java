package com.epms.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "ratings",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "purchase_request_id",
                                "product_id"
                        }
                )
        }
)
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Purchase request from which the product was purchased
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "purchase_request_id",
            nullable = false
    )
    private PurchaseRequest purchaseRequest;

    // Product being rated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "product_id",
            nullable = false
    )
    private Product product;

    // Employee who gave the rating
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    // Rating value: 1 to 5
    @Column(nullable = false)
    private Integer rating;

    // Optional review
    @Column(length = 1000)
    private String review;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Rating() {
    }

    public Rating(
            Long id,
            PurchaseRequest purchaseRequest,
            Product product,
            User user,
            Integer rating,
            String review,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.purchaseRequest = purchaseRequest;
        this.product = product;
        this.user = user;
        this.rating = rating;
        this.review = review;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    public void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {

        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public void setPurchaseRequest(
            PurchaseRequest purchaseRequest) {

        this.purchaseRequest = purchaseRequest;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {

        this.product = product;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {

        this.user = user;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {

        this.rating = rating;
    }

    public String getReview() {
        return review;
    }

    public void setReview(String review) {

        this.review = review;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}