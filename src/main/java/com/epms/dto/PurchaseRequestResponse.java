package com.epms.dto;

import com.epms.enums.PurchaseStatus;

import java.time.LocalDateTime;
import java.util.List;

public class PurchaseRequestResponse {

    private Long id;

    private String employeeName;

    private PurchaseStatus status;

    private LocalDateTime requestDate;

    private List<PurchaseRequestItemResponse> items;

    private DeliveryAddressResponse deliveryAddress;

    public PurchaseRequestResponse() {
    }

    public PurchaseRequestResponse(
            Long id,
            String employeeName,
            PurchaseStatus status,
            LocalDateTime requestDate,
            List<PurchaseRequestItemResponse> items,
            DeliveryAddressResponse deliveryAddress) {

        this.id = id;
        this.employeeName = employeeName;
        this.status = status;
        this.requestDate = requestDate;
        this.items = items;
        this.deliveryAddress = deliveryAddress;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
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

    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }

    public List<PurchaseRequestItemResponse> getItems() {
        return items;
    }

    public void setItems(
            List<PurchaseRequestItemResponse> items) {

        this.items = items;
    }

    public DeliveryAddressResponse getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(
            DeliveryAddressResponse deliveryAddress) {

        this.deliveryAddress = deliveryAddress;
    }
}