package com.epms.service.impl;

import com.epms.dto.CreateProductRequest;
import com.epms.dto.ProductResponse;
import com.epms.dto.UpdateProductRequest;
import com.epms.entity.Product;
import com.epms.repository.ProductRepository;
import com.epms.service.ProductService;
import com.epms.util.ProductMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public ProductResponse createProduct(CreateProductRequest request) {

        if (productRepository.existsByName(request.getName())) {
            throw new RuntimeException("Product already exists.");
        }

        Product product = ProductMapper.toEntity(request);

        Product savedProduct = productRepository.save(product);

        return ProductMapper.toResponse(savedProduct);
    }

    @Override
    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll()
                .stream()
                .map(ProductMapper::toResponse)
                .toList();
    }

    @Override
    public ProductResponse getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found."));

        return ProductMapper.toResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id,
                                         UpdateProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found."));

        ProductMapper.updateEntity(product, request);

        Product updatedProduct = productRepository.save(product);

        return ProductMapper.toResponse(updatedProduct);
    }

    @Override
    public void deleteProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found."));

        productRepository.delete(product);
    }
}