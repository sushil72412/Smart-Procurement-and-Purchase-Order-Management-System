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

import java.util.List;

@Service
@Transactional
public class PurchaseRequestServiceImpl implements PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public PurchaseRequestServiceImpl(
            PurchaseRequestRepository purchaseRequestRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {

        this.purchaseRequestRepository = purchaseRequestRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
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
                .orElseThrow(() -> new RuntimeException("Purchase Request not found."));

        request.setStatus(PurchaseStatus.APPROVED);

        PurchaseRequest updated =
                purchaseRequestRepository.save(request);

        return PurchaseRequestMapper.toResponse(updated);
    }

    @Override
    public PurchaseRequestResponse rejectRequest(Long requestId) {

        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Purchase Request not found."));

        request.setStatus(PurchaseStatus.REJECTED);

        PurchaseRequest updated =
                purchaseRequestRepository.save(request);

        return PurchaseRequestMapper.toResponse(updated);
    }
}