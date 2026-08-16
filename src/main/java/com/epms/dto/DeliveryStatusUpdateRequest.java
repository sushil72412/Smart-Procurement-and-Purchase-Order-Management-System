package com.epms.dto;

import com.epms.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public class DeliveryStatusUpdateRequest {

    @NotNull(message = "Delivery status is required")
    private DeliveryStatus status;

    public DeliveryStatusUpdateRequest() {
    }

    public DeliveryStatusUpdateRequest(DeliveryStatus status) {
        this.status = status;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }
}
