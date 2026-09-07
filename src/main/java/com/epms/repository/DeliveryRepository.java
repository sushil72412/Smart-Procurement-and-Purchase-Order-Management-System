package com.epms.repository;

import com.epms.entity.Delivery;
import com.epms.enums.DeliveryStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository
        extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByPurchaseRequestId(
            Long purchaseRequestId);

    boolean existsByPurchaseRequestId(
            Long purchaseRequestId);

    List<Delivery> findBySupplierId(
            Long supplierId);

    List<Delivery> findByStatus(
            DeliveryStatus status);

    @Query("""
        SELECT d
        FROM Delivery d
        JOIN FETCH d.purchaseRequest pr
        JOIN FETCH d.supplier s
    """)
    List<Delivery> findAllWithDetails();
}