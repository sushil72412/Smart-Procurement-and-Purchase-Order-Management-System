package com.epms.service.impl;

import com.epms.dto.CreateRatingRequest;
import com.epms.dto.ProductRatingSummaryResponse;
import com.epms.dto.RatingResponse;
import com.epms.entity.Delivery;
import com.epms.entity.Product;
import com.epms.entity.PurchaseRequest;
import com.epms.entity.Rating;
import com.epms.entity.User;
import com.epms.enums.DeliveryStatus;
import com.epms.repository.DeliveryRepository;
import com.epms.repository.ProductRepository;
import com.epms.repository.PurchaseRequestRepository;
import com.epms.repository.RatingRepository;
import com.epms.repository.UserRepository;
import com.epms.service.RatingService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;

    public RatingServiceImpl(
            RatingRepository ratingRepository,
            PurchaseRequestRepository purchaseRequestRepository,
            ProductRepository productRepository,
            DeliveryRepository deliveryRepository,
            UserRepository userRepository) {

        this.ratingRepository = ratingRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.productRepository = productRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // CREATE RATING
    // =========================================================

    @Override
    public RatingResponse createRating(
            CreateRatingRequest request) {

        // -----------------------------------------------------
        // 1. Find Purchase Request
        // -----------------------------------------------------

        PurchaseRequest purchaseRequest =
                purchaseRequestRepository.findById(
                        request.getPurchaseRequestId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Purchase request not found."
                        )
                );

        // -----------------------------------------------------
        // 2. Get authenticated user from JWT
        // -----------------------------------------------------

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated."
            );
        }

        String authenticatedEmail =
                authentication.getName();

        // -----------------------------------------------------
        // 3. Find authenticated user
        // -----------------------------------------------------

        User authenticatedUser =
                userRepository.findByEmail(
                        authenticatedEmail
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Authenticated user not found."
                        )
                );

        // -----------------------------------------------------
        // 4. Get employee who owns purchase request
        // -----------------------------------------------------

        User employee =
                purchaseRequest.getUser();

        if (employee == null) {

            throw new RuntimeException(
                    "Employee not found for this purchase request."
            );
        }

        // -----------------------------------------------------
        // 5. Verify authenticated user owns purchase request
        // -----------------------------------------------------

        if (!employee.getId()
                .equals(authenticatedUser.getId())) {

            throw new RuntimeException(
                    "You are not authorized to rate a product from this purchase request."
            );
        }

        // -----------------------------------------------------
        // 6. Find Product
        // -----------------------------------------------------

        Product product =
                productRepository.findById(
                        request.getProductId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Product not found."
                        )
                );

        // -----------------------------------------------------
        // 7. Verify Product belongs to Purchase Request
        // -----------------------------------------------------

        boolean productPurchased =
                purchaseRequest.getItems()
                        .stream()
                        .anyMatch(item ->
                                item.getProduct()
                                        .getId()
                                        .equals(product.getId())
                        );

        if (!productPurchased) {

            throw new RuntimeException(
                    "This product was not purchased in this purchase request."
            );
        }

        // -----------------------------------------------------
        // 8. Find Delivery
        // -----------------------------------------------------

        Delivery delivery =
                deliveryRepository
                        .findByPurchaseRequestId(
                                purchaseRequest.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Delivery not found for this purchase request."
                                )
                        );

        // -----------------------------------------------------
        // 9. Product can only be rated after DELIVERED
        // -----------------------------------------------------

        if (delivery.getStatus()
                != DeliveryStatus.DELIVERED) {

            throw new RuntimeException(
                    "Product can only be rated after it has been delivered."
            );
        }

        // -----------------------------------------------------
        // 10. Prevent duplicate rating
        // -----------------------------------------------------

        if (ratingRepository
                .existsByPurchaseRequestIdAndProductId(
                        purchaseRequest.getId(),
                        product.getId()
                )) {

            throw new RuntimeException(
                    "You have already rated this product for this purchase request."
            );
        }

        // -----------------------------------------------------
        // 11. Validate Rating
        // -----------------------------------------------------

        if (request.getRating() == null
                || request.getRating() < 1
                || request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5."
            );
        }

        // -----------------------------------------------------
        // 12. Create Rating
        // -----------------------------------------------------

        Rating rating =
                new Rating();

        rating.setPurchaseRequest(
                purchaseRequest
        );

        rating.setProduct(
                product
        );

        // IMPORTANT:
        // Store the authenticated user, not a user
        // supplied by the request.

        rating.setUser(
                authenticatedUser
        );

        rating.setRating(
                request.getRating()
        );

        rating.setReview(
                request.getReview()
        );

        // -----------------------------------------------------
        // 13. Save Rating
        // -----------------------------------------------------

        Rating savedRating =
                ratingRepository.save(rating);

        return mapToResponse(
                savedRating
        );
    }

    // GET RATING BY ID

    @Override
    public RatingResponse getRatingById(
            Long id) {

        Rating rating =
                ratingRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Rating not found."
                                )
                        );

        return mapToResponse(
                rating
        );
    }

    // GET RATINGS BY PRODUCT

    @Override
    public List<RatingResponse> getRatingsByProductId(
            Long productId) {

        if (!productRepository.existsById(
                productId)) {

            throw new RuntimeException(
                    "Product not found."
            );
        }

        return ratingRepository
                .findByProductId(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // GET RATINGS BY USER

    @Override
    public List<RatingResponse> getRatingsByUserId(
            Long userId) {

        if (!userRepository.existsById(
                userId)) {

            throw new RuntimeException(
                    "User not found."
            );
        }

        return ratingRepository
                .findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // GET ALL RATINGS

    @Override
    public List<RatingResponse> getAllRatings() {

        return ratingRepository
                .findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // PRODUCT RATING SUMMARY

    @Override
    public ProductRatingSummaryResponse getProductRatingSummary(
            Long productId) {

        // 1. Check Product

        Product product =
                productRepository.findById(
                        productId
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Product not found."
                        )
                );

        // 2. Calculate Average Rating

        Double averageRating =
                ratingRepository
                        .findAverageRatingByProductId(
                                productId
                        );

        // 3. Count Ratings

        Long totalRatings =
                (long) ratingRepository
                        .findByProductId(productId)
                        .size();

        // 4. No ratings

        if (averageRating == null) {

            averageRating = 0.0;
        }


        return new ProductRatingSummaryResponse(
                product.getId(),
                product.getName(),
                averageRating,
                totalRatings
        );
    }

    private RatingResponse mapToResponse(
            Rating rating) {

        Product product =
                rating.getProduct();

        User employee =
                rating.getUser();

        return new RatingResponse(
                rating.getId(),
                rating.getPurchaseRequest().getId(),
                product.getId(),
                product.getName(),
                employee.getId(),
                employee.getFullName(),
                rating.getRating(),
                rating.getReview(),
                rating.getCreatedAt()
        );
    }
}