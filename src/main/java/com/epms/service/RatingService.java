package com.epms.service;

import com.epms.dto.CreateRatingRequest;
import com.epms.dto.ProductRatingSummaryResponse;
import com.epms.dto.RatingResponse;

import java.util.List;

public interface RatingService {

    RatingResponse createRating(CreateRatingRequest request);

    RatingResponse getRatingById(Long id);

    List<RatingResponse> getRatingsByProductId(Long productId);

    List<RatingResponse> getRatingsByUserId(Long userId);

    List<RatingResponse> getAllRatings();

    ProductRatingSummaryResponse getProductRatingSummary(Long productId);
}