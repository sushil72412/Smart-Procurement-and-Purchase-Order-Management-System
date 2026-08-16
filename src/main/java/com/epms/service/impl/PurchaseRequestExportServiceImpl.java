package com.epms.service.impl;

import com.epms.entity.PurchaseRequest;
import com.epms.entity.PurchaseRequestItem;
import com.epms.entity.User;
import com.epms.enums.Role;
import com.epms.repository.PurchaseRequestRepository;
import com.epms.repository.UserRepository;
import com.epms.service.PurchaseRequestExportService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class PurchaseRequestExportServiceImpl
        implements PurchaseRequestExportService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;

    public PurchaseRequestExportServiceImpl(
            PurchaseRequestRepository purchaseRequestRepository,
            UserRepository userRepository) {

        this.purchaseRequestRepository =
                purchaseRequestRepository;

        this.userRepository =
                userRepository;
    }

    @Override
    public byte[] exportPurchaseRequests() {

        List<PurchaseRequest> requests =
                getRequestsForCurrentUser();

        StringBuilder csv = new StringBuilder();

        // CSV Header
        csv.append("Request ID,Employee,Email,Request Date,")
                .append("Product,Unit Price,Quantity,Total Price,Status\n");

        for (PurchaseRequest request : requests) {

            User user = request.getUser();

            for (PurchaseRequestItem item :
                    request.getItems()) {

                String productName = "";

                BigDecimal unitPrice = BigDecimal.ZERO;

                if (item.getProduct() != null &&
                        item.getProduct().getPrice() != null) {

                    unitPrice = item.getProduct().getPrice();
                }

                BigDecimal totalPrice =
                        unitPrice.multiply(
                                BigDecimal.valueOf(item.getQuantity())
                        );

                csv.append(request.getId())
                        .append(",")
                        .append(escapeCsv(user.getFullName()))
                        .append(",")
                        .append(escapeCsv(user.getEmail()))
                        .append(",")
                        .append(request.getRequestDate())
                        .append(",")
                        .append(escapeCsv(productName))
                        .append(",")
                        .append(unitPrice)
                        .append(",")
                        .append(item.getQuantity())
                        .append(",")
                        .append(totalPrice)
                        .append(",")
                        .append(request.getStatus())
                        .append("\n");
            }
        }

        return csv.toString()
                .getBytes(StandardCharsets.UTF_8);
    }

    // GET REQUESTS BASED ON CURRENT USER ROLE

    private List<PurchaseRequest>
    getRequestsForCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated."
            );
        }

        String email =
                authentication.getName();

        Role role =
                getCurrentUserRole(authentication);

        // ADMIN
        // Manager
        // can export all requests
        if (role == Role.ADMIN ||
                role == Role.MANAGER) {

            return purchaseRequestRepository
                    .findAll();
        }

        // EMPLOYEE
        // can export only own requests
        if (role == Role.EMPLOYEE) {

            User user =
                    userRepository
                            .findByEmail(email)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "User not found."
                                    )
                            );

            return purchaseRequestRepository
                    .findByUserId(user.getId());
        }

        throw new RuntimeException(
                "You are not authorized to export " +
                        "purchase requests."
        );
    }

    // GET CURRENT USER ROLE

    private Role getCurrentUserRole(
            Authentication authentication) {

        return authentication
                .getAuthorities()
                .stream()
                .map(authority ->
                        authority.getAuthority())
                .filter(authority ->
                        authority.startsWith("ROLE_"))
                .map(authority ->
                        authority.substring(5))
                .map(Role::valueOf)
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "User role not found."
                        )
                );
    }

    // CSV ESCAPE

    private String escapeCsv(String value) {

        if (value == null) {
            return "";
        }

        if (value.contains(",") ||
                value.contains("\"") ||
                value.contains("\n")) {

            return "\"" +
                    value.replace(
                            "\"",
                            "\"\""
                    ) +
                    "\"";
        }

        return value;
    }
}