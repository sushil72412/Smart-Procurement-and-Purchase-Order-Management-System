package com.epms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreatePurchaseRequest {

    @Valid
    @NotEmpty(message = "At least one product is required")
    private List<CreatePurchaseRequestItem> items;

    @Valid
    @NotNull(message = "Delivery address is required")
    private CreateDeliveryAddressRequest deliveryAddress;


    public CreatePurchaseRequest() {
    }


    public CreatePurchaseRequest(
            List<CreatePurchaseRequestItem> items,
            CreateDeliveryAddressRequest deliveryAddress) {

        this.items = items;
        this.deliveryAddress = deliveryAddress;
    }


    public List<CreatePurchaseRequestItem> getItems() {
        return items;
    }


    public void setItems(
            List<CreatePurchaseRequestItem> items) {

        this.items = items;
    }


    public CreateDeliveryAddressRequest getDeliveryAddress() {
        return deliveryAddress;
    }


    public void setDeliveryAddress(
            CreateDeliveryAddressRequest deliveryAddress) {

        this.deliveryAddress = deliveryAddress;
    }
}