package com.epms.util;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.UpdateUserRequest;
import com.epms.dto.UserResponse;
import com.epms.entity.User;

public class UserMapper {
    private UserMapper() {
    }

    // DTO -> Entity
    public static User toEntity(CreateUserRequest request) {

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());

        return user;
    }

    // Entity -> Response DTO
    public static UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }

    // Update DTO -> Existing Entity
    public static void updateEntity(User user, UpdateUserRequest request) {

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
    }
}
