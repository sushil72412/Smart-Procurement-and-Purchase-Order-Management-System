package com.epms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreatePurchaseRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @Valid
    @NotEmpty(message = "At least one product is required")
    private List<CreatePurchaseRequestItem> items;

    public CreatePurchaseRequest() {
    }

    public CreatePurchaseRequest(Long userId,
                                 List<CreatePurchaseRequestItem> items) {
        this.userId = userId;
        this.items = items;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<CreatePurchaseRequestItem> getItems() {
        return items;
    }

    public void setItems(List<CreatePurchaseRequestItem> items) {
        this.items = items;
    }
}