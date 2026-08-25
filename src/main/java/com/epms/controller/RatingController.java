package com.epms.controller;

import com.epms.dto.CreateRatingRequest;
import com.epms.dto.ProductRatingSummaryResponse;
import com.epms.dto.RatingResponse;
import com.epms.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    // Create a product rating
    @PostMapping
    public ResponseEntity<RatingResponse> createRating(
            @Valid @RequestBody CreateRatingRequest request) {

        RatingResponse response =
                ratingService.createRating(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // Get rating by ID
    @GetMapping("/{id}")
    public ResponseEntity<RatingResponse> getRatingById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ratingService.getRatingById(id)
        );
    }

    // Get all ratings for a product
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<RatingResponse>> getRatingsByProduct(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                ratingService.getRatingsByProductId(productId)
        );
    }

    // Get product rating summary
    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<ProductRatingSummaryResponse> getProductRatingSummary(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                ratingService.getProductRatingSummary(productId)
        );
    }

    // Get ratings submitted by a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RatingResponse>> getRatingsByUser(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                ratingService.getRatingsByUserId(userId)
        );
    }

    // Get all ratings
    @GetMapping
    public ResponseEntity<List<RatingResponse>> getAllRatings() {

        return ResponseEntity.ok(
                ratingService.getAllRatings()
        );
    }
}