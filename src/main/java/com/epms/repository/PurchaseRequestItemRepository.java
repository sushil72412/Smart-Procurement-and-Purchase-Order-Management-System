package com.epms.repository;

import com.epms.entity.PurchaseRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestItemRepository
        extends JpaRepository<PurchaseRequestItem, Long> {
}