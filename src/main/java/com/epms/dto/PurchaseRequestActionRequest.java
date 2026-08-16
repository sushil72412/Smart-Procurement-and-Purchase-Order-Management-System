package com.epms.dto;

import jakarta.validation.constraints.NotBlank;

public class PurchaseRequestActionRequest {

    @NotBlank(message = "Action is required")
    private String action;

    public PurchaseRequestActionRequest() {
    }

    public PurchaseRequestActionRequest(String action) {
        this.action = action;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}