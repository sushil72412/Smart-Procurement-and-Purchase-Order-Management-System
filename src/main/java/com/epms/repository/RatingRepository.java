package com.epms.repository;

import com.epms.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository
        extends JpaRepository<Rating, Long> {

    Optional<Rating> findByPurchaseRequestIdAndProductId(
            Long purchaseRequestId,
            Long productId
    );

    List<Rating> findByProductId(Long productId);

    List<Rating> findByUserId(Long userId);

    boolean existsByPurchaseRequestIdAndProductId(
            Long purchaseRequestId,
            Long productId
    );

    @Query("""
           SELECT AVG(r.rating)
           FROM Rating r
           WHERE r.product.id = :productId
           """)
    Double findAverageRatingByProductId(
            @Param("productId") Long productId
    );
}