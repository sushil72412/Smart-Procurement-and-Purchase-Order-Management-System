package com.epms.dto;

public class ProductRatingSummaryResponse {

    private Long productId;

    private String productName;

    private Double averageRating;

    private Long totalRatings;

    public ProductRatingSummaryResponse() {
    }

    public ProductRatingSummaryResponse(
            Long productId,
            String productName,
            Double averageRating,
            Long totalRatings) {

        this.productId = productId;
        this.productName = productName;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }
}