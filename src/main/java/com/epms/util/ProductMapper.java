package com.epms.util;

import com.epms.dto.CreateProductRequest;
import com.epms.dto.ProductResponse;
import com.epms.dto.UpdateProductRequest;
import com.epms.entity.Product;

public class ProductMapper {

    private ProductMapper() {
    }

    // DTO -> Entity
    public static Product toEntity(CreateProductRequest request) {

        Product product = new Product();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(request.getCategory());

        return product;
    }

    // Entity -> Response DTO
    public static ProductResponse toResponse(Product product) {

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory()
        );
    }

    // Update DTO -> Existing Entity
    public static void updateEntity(Product product, UpdateProductRequest request) {

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(request.getCategory());
    }
}