package com.epms.service.impl;

import com.epms.dto.CreatePurchaseRequest;
import com.epms.dto.CreatePurchaseRequestItem;
import com.epms.dto.PurchaseRequestResponse;
import com.epms.entity.Product;
import com.epms.entity.PurchaseRequest;
import com.epms.entity.PurchaseRequestItem;
import com.epms.entity.User;
import com.epms.enums.PurchaseStatus;
import com.epms.repository.ProductRepository;
import com.epms.repository.PurchaseRequestRepository;
import com.epms.repository.UserRepository;
import com.epms.service.PurchaseRequestService;
import com.epms.util.PurchaseRequestMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.epms.enums.Role;
import com.epms.service.EmailService;
import java.util.List;

@Service
@Transactional
public class PurchaseRequestServiceImpl implements PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public PurchaseRequestServiceImpl(
            PurchaseRequestRepository purchaseRequestRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            EmailService emailService) {

        this.purchaseRequestRepository = purchaseRequestRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    @Override
    public PurchaseRequestResponse createPurchaseRequest(CreatePurchaseRequest request) {

        // Find User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found."));

        // Create Purchase Request
        PurchaseRequest purchaseRequest = new PurchaseRequest();
        purchaseRequest.setUser(user);
        purchaseRequest.setStatus(PurchaseStatus.PENDING);

        // Loop through request items
        for (CreatePurchaseRequestItem itemDto : request.getItems()) {

            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found."));

            // Check Stock
            if (product.getStock() < itemDto.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for product: " + product.getName());
            }

            PurchaseRequestItem item = new PurchaseRequestItem();

            item.setPurchaseRequest(purchaseRequest);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());

            purchaseRequest.getItems().add(item);
        }

        PurchaseRequest savedRequest =
                purchaseRequestRepository.save(purchaseRequest);


// Send notification to all managers
        List<User> managers = userRepository.findByRole(Role.MANAGER);

        for (User manager : managers) {

            emailService.sendEmail(
                    manager.getEmail(),
                    "New Purchase Request",
                    "Hello " + manager.getFullName()
                            + ",\n\n"
                            + "Employee " + user.getFullName()
                            + " has submitted a new purchase request."
                            + "\n\n"
                            + "Purchase Request ID: " + savedRequest.getId()
                            + "\nStatus: PENDING"
                            + "\n\n"
                            + "Please review the purchase request."
            );
        }


// Send confirmation to employee
        emailService.sendEmail(
                user.getEmail(),
                "Purchase Request Submitted",
                "Hello " + user.getFullName()
                        + ",\n\n"
                        + "Your purchase request has been submitted successfully."
                        + "\n\n"
                        + "Purchase Request ID: " + savedRequest.getId()
                        + "\nStatus: PENDING"
                        + "\n\n"
                        + "You will be notified when the manager reviews your request."
        );


        return PurchaseRequestMapper.toResponse(savedRequest);
    }

    @Override
    public List<PurchaseRequestResponse> getAllRequests() {

        return purchaseRequestRepository.findAll()
                .stream()
                .map(PurchaseRequestMapper::toResponse)
                .toList();
    }

    @Override
    public PurchaseRequestResponse approveRequest(Long requestId) {

        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Purchase Request not found."));

        // Request can only be approved when it is PENDING
        if (request.getStatus() != PurchaseStatus.PENDING) {

            throw new RuntimeException(
                    "Purchase Request has already been processed."
            );
        }

        // Change status
        request.setStatus(PurchaseStatus.APPROVED);

        // Save
        PurchaseRequest updated =
                purchaseRequestRepository.save(request);

        // Send approval email
        emailService.sendEmail(
                request.getUser().getEmail(),
                "Purchase Request Approved",
                "Hello " + request.getUser().getFullName()
                        + ",\n\n"
                        + "Your purchase request has been approved."
                        + "\n\n"
                        + "Purchase Request ID: " + request.getId()
                        + "\nStatus: APPROVED"
                        + "\n\n"
                        + "Thank you."
                        + "\nEnterprise Procurement System"
        );

        return PurchaseRequestMapper.toResponse(updated);
    }

    @Override
    public PurchaseRequestResponse rejectRequest(Long requestId) {

        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Purchase Request not found."));

        // Request can only be rejected when it is PENDING
        if (request.getStatus() != PurchaseStatus.PENDING) {

            throw new RuntimeException(
                    "Purchase Request has already been processed."
            );
        }

        // Change status
        request.setStatus(PurchaseStatus.REJECTED);

        // Save
        PurchaseRequest updated =
                purchaseRequestRepository.save(request);

        // Send rejection email
        emailService.sendEmail(
                request.getUser().getEmail(),
                "Purchase Request Rejected",
                "Hello " + request.getUser().getFullName()
                        + ",\n\n"
                        + "Your purchase request has been rejected."
                        + "\n\n"
                        + "Purchase Request ID: " + request.getId()
                        + "\nStatus: REJECTED"
                        + "\n\n"
                        + "Please contact the procurement manager if you need more information."
                        + "\n\n"
                        + "Enterprise Procurement System"
        );

        return PurchaseRequestMapper.toResponse(updated);
    }

}