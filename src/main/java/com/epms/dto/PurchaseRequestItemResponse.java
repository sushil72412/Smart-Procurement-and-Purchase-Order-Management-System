package com.epms.dto;

public class PurchaseRequestItemResponse {

    private Long productId;

    private String productName;

    private Integer quantity;

    public PurchaseRequestItemResponse() {
    }

    public PurchaseRequestItemResponse(Long productId,
                                       String productName,
                                       Integer quantity) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}