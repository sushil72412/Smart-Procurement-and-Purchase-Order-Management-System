package com.epms.repository;

import com.epms.entity.Payment;
import com.epms.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPurchaseRequestId(
            Long purchaseRequestId
    );

    List<Payment> findByStatus(
            PaymentStatus status
    );

    boolean existsByPurchaseRequestId(
            Long purchaseRequestId
    );
}