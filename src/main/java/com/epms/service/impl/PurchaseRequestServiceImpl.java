package com.epms.service.impl;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.CreatePurchaseRequestItem;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.entity.DeliveryAddress;
import com.epms.entity.Product;
import com.epms.entity.PurchaseRequest;
import com.epms.entity.PurchaseRequestItem;
import com.epms.entity.User;
import com.epms.enums.PurchaseStatus;
import com.epms.enums.Role;
import com.epms.repository.ProductRepository;
import com.epms.repository.PurchaseRequestRepository;
import com.epms.repository.UserRepository;
import com.epms.service.EmailService;
import com.epms.service.PurchaseRequestService;
import com.epms.util.PurchaseRequestMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseRequestServiceImpl
        implements PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public PurchaseRequestServiceImpl(
            PurchaseRequestRepository purchaseRequestRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            EmailService emailService) {

        this.purchaseRequestRepository =
                purchaseRequestRepository;

        this.userRepository =
                userRepository;

        this.productRepository =
                productRepository;

        this.emailService =
                emailService;
    }


    // =========================================================
    // CREATE PURCHASE REQUEST
    // =========================================================


    @Override
    public PurchaseRequestResponse createPurchaseRequest(
            CreatePurchaseRequest request) {

        // Get authenticated employee
        User currentUser = userRepository
                .findByEmail(getCurrentUserEmail())
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found.")
                );

        // Only EMPLOYEE can create purchase request
        if (currentUser.getRole() != Role.EMPLOYEE) {
            throw new RuntimeException(
                    "Only employees can create purchase requests."
            );
        }

        // Employee can create request only for themselves
        if (!currentUser.getId().equals(request.getUserId())) {
            throw new RuntimeException(
                    "You can only create purchase requests for yourself."
            );
        }

        User user = currentUser;

        // continue with your existing code...


        PurchaseRequest purchaseRequest =
                new PurchaseRequest();

        purchaseRequest.setUser(user);

        purchaseRequest.setStatus(
                PurchaseStatus.PENDING
        );

        // =====================================================
        // CREATE DELIVERY ADDRESS
        // =====================================================

        DeliveryAddress address =
                new DeliveryAddress();

        address.setRecipientName(
                request.getDeliveryAddress().getRecipientName()
        );

        address.setPhone(
                request.getDeliveryAddress().getPhone()
        );

        address.setAddressLine1(
                request.getDeliveryAddress().getAddressLine1()
        );

        address.setAddressLine2(
                request.getDeliveryAddress().getAddressLine2()
        );

        address.setCity(
                request.getDeliveryAddress().getCity()
        );

        address.setState(
                request.getDeliveryAddress().getState()
        );

        address.setPostalCode(
                request.getDeliveryAddress().getPostalCode()
        );

        address.setCountry(
                request.getDeliveryAddress().getCountry()
        );

        purchaseRequest.setDeliveryAddress(address);

        // =====================================================
        // CREATE PURCHASE REQUEST ITEMS
        // =====================================================

        for (CreatePurchaseRequestItem itemDto :
                request.getItems()) {

            Product product =
                    productRepository
                            .findById(itemDto.getProductId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Product not found with ID: "
                                                    + itemDto.getProductId()
                                    )
                            );

            PurchaseRequestItem item =
                    new PurchaseRequestItem();

            item.setProduct(product);

            item.setQuantity(
                    itemDto.getQuantity()
            );

            item.setPurchaseRequest(
                    purchaseRequest
            );

            purchaseRequest
                    .getItems()
                    .add(item);
        }


        // =====================================================
        // SAVE PURCHASE REQUEST
        // =====================================================

        PurchaseRequest savedRequest =
                purchaseRequestRepository
                        .save(purchaseRequest);


        // =====================================================
        // SEND EMAIL TO EMPLOYEE
        // =====================================================

        emailService.sendEmail(
                user.getEmail(),

                "Purchase Request Submitted",

                "Hello " + user.getFullName()
                        + ",\n\n"
                        + "Your purchase request has been "
                        + "submitted successfully."
                        + "\n\n"
                        + "Purchase Request ID: "
                        + savedRequest.getId()
                        + "\n"
                        + "Status: PENDING"
                        + "\n\n"
                        + "You will be notified when the "
                        + "manager reviews your request."
        );


        // =====================================================
        // SEND EMAIL TO ALL MANAGERS
        // =====================================================

        List<User> managers =
                userRepository.findByRole(Role.MANAGER);

        for (User manager : managers) {

            emailService.sendEmail(

                    manager.getEmail(),

                    "New Purchase Request",

                    "Hello " + manager.getFullName()
                            + ",\n\n"
                            + "Employee "
                            + user.getFullName()
                            + " has submitted a new "
                            + "purchase request."
                            + "\n\n"
                            + "Purchase Request ID: "
                            + savedRequest.getId()
                            + "\n"
                            + "Status: PENDING"
                            + "\n\n"
                            + "Please review the purchase request."
            );
        }


        return PurchaseRequestMapper
                .toResponse(savedRequest);
    }


    // =========================================================
    // GET ALL PURCHASE REQUESTS
    // =========================================================

    @Override
    public List<PurchaseRequestResponse>
    getAllPurchaseRequests() {

        Role role = getCurrentUserRole();

        List<PurchaseRequest> requests;

        if (role == Role.ADMIN ||
                role == Role.MANAGER) {

            // Admin and Manager can see all requests
            requests =
                    purchaseRequestRepository.findAll();

        } else {

            // Employee can only see their own requests

            String email =
                    getCurrentUserEmail();

            User user =
                    userRepository
                            .findByEmail(email)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "User not found."
                                    )
                            );

            requests =
                    purchaseRequestRepository
                            .findByUserId(user.getId());
        }


        return requests
                .stream()
                .map(PurchaseRequestMapper::toResponse)
                .toList();
    }


    // =========================================================
    // GET PURCHASE REQUEST BY ID
    // =========================================================

    @Override
    public PurchaseRequestResponse
    getPurchaseRequestById(Long id) {

        PurchaseRequest request =
                purchaseRequestRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase Request not found."
                                )
                        );


        Role role = getCurrentUserRole();


        // ADMIN can view everything
        if (role == Role.ADMIN) {

            return PurchaseRequestMapper
                    .toResponse(request);
        }


        // MANAGER can view everything
        if (role == Role.MANAGER) {

            return PurchaseRequestMapper
                    .toResponse(request);
        }


        // EMPLOYEE can only view own request
        String email =
                getCurrentUserEmail();

        if (!request.getUser()
                .getEmail()
                .equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to view this purchase request."
            );
        }


        return PurchaseRequestMapper
                .toResponse(request);
    }


    // =========================================================
    // UNIFIED PROCESS REQUEST
    // =========================================================
    //
    // PATCH /api/purchase-requests/{id}
    //
    // {
    //     "action": "APPROVE"
    // }
    //
    // OR
    //
    // {
    //     "action": "REJECT"
    // }
    //
    // =========================================================

    @Override
    public PurchaseRequestResponse processRequest(
            Long requestId,
            String action) {

        PurchaseRequest request =
                purchaseRequestRepository
                        .findById(requestId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Purchase Request not found."
                                )
                        );


        // =====================================================
        // ONLY MANAGER CAN APPROVE / REJECT
        // =====================================================

        Role currentRole =
                getCurrentUserRole();

        if (currentRole != Role.MANAGER) {

            throw new RuntimeException(
                    "Only managers can approve or reject "
                            + "purchase requests."
            );
        }


        // =====================================================
        // REQUEST MUST BE PENDING
        // =====================================================

        if (request.getStatus()
                != PurchaseStatus.PENDING) {

            throw new RuntimeException(
                    "Purchase Request has already been processed."
            );
        }


        if (action == null ||
                action.trim().isEmpty()) {

            throw new RuntimeException(
                    "Action is required."
            );
        }


        String normalizedAction =
                action.trim().toUpperCase();


        // =====================================================
        // APPROVE
        // =====================================================

        if (normalizedAction.equals("APPROVE")) {

            return approveRequest(request);
        }


        // =====================================================
        // REJECT
        // =====================================================

        if (normalizedAction.equals("REJECT")) {

            return rejectRequest(request);
        }


        // =====================================================
        // INVALID ACTION
        // =====================================================

        throw new RuntimeException(
                "Invalid action. Use APPROVE or REJECT."
        );
    }


    // =========================================================
    // APPROVE REQUEST
    // =========================================================

    private PurchaseRequestResponse
    approveRequest(PurchaseRequest request) {

        request.setStatus(
                PurchaseStatus.APPROVED
        );


        PurchaseRequest updatedRequest =
                purchaseRequestRepository
                        .save(request);


        User employee =
                request.getUser();


        // Send approval email
        emailService.sendEmail(

                employee.getEmail(),

                "Purchase Request Approved",

                "Hello "
                        + employee.getFullName()
                        + ",\n\n"
                        + "Your purchase request has been "
                        + "approved."
                        + "\n\n"
                        + "Purchase Request ID: "
                        + request.getId()
                        + "\n"
                        + "Status: APPROVED"
                        + "\n\n"
                        + "Thank you."
                        + "\nEnterprise Procurement System"
        );


        return PurchaseRequestMapper
                .toResponse(updatedRequest);
    }


    // =========================================================
    // REJECT REQUEST
    // =========================================================

    private PurchaseRequestResponse
    rejectRequest(PurchaseRequest request) {

        request.setStatus(
                PurchaseStatus.REJECTED
        );


        PurchaseRequest updatedRequest =
                purchaseRequestRepository
                        .save(request);


        User employee =
                request.getUser();


        // Send rejection email
        emailService.sendEmail(

                employee.getEmail(),

                "Purchase Request Rejected",

                "Hello "
                        + employee.getFullName()
                        + ",\n\n"
                        + "Your purchase request has been "
                        + "rejected."
                        + "\n\n"
                        + "Purchase Request ID: "
                        + request.getId()
                        + "\n"
                        + "Status: REJECTED"
                        + "\n\n"
                        + "Please contact the procurement "
                        + "manager if you need more information."
                        + "\n\n"
                        + "Enterprise Procurement System"
        );


        return PurchaseRequestMapper
                .toResponse(updatedRequest);
    }


    // =========================================================
    // GET CURRENT USER EMAIL
    // =========================================================

    private String getCurrentUserEmail() {

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


        return authentication.getName();
    }


    // =========================================================
    // GET CURRENT USER ROLE
    // =========================================================

    private Role getCurrentUserRole() {

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


        return authentication
                .getAuthorities()
                .stream()
                .map(authority ->
                        authority.getAuthority()
                )
                .filter(authority ->
                        authority.startsWith("ROLE_")
                )
                .map(authority ->
                        authority.substring(5)
                )
                .map(Role::valueOf)
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "User role not found."
                        )
                );
    }
}