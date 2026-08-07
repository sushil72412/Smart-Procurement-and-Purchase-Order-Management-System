package com.epms.repository;

import com.epms.entity.PurchaseRequest;
import com.epms.entity.User;
import com.epms.enums.PurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    List<PurchaseRequest> findByStatus(PurchaseStatus status);

    List<PurchaseRequest> findByUser(User user);

}