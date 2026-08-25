package com.epms.dto;

import java.time.LocalDateTime;

public class RatingResponse {

    private Long id;

    private Long purchaseRequestId;

    private Long productId;

    private String productName;

    private Long userId;

    private String employeeName;

    private Integer rating;

    private String review;

    private LocalDateTime createdAt;

    public RatingResponse() {
    }

    public RatingResponse(
            Long id,
            Long purchaseRequestId,
            Long productId,
            String productName,
            Long userId,
            String employeeName,
            Integer rating,
            String review,
            LocalDateTime createdAt) {

        this.id = id;
        this.purchaseRequestId = purchaseRequestId;
        this.productId = productId;
        this.productName = productName;
        this.userId = userId;
        this.employeeName = employeeName;
        this.rating = rating;
        this.review = review;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public Integer getRating() {
        return rating;
    }

    public String getReview() {
        return review;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}