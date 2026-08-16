package com.epms.repository;

import com.epms.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}