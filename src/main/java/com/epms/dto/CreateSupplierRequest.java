package com.epms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
public class CreateSupplierRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String companyAddress;

    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    public CreateSupplierRequest() {
    }

    public CreateSupplierRequest(
            Long userId,
            String companyName,
            String companyAddress,
            String contactPerson) {

        this.userId = userId;
        this.companyName = companyName;
        this.companyAddress = companyAddress;
        this.contactPerson = contactPerson;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }
}