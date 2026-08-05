package com.epms.service;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.UpdateUserRequest;
import com.epms.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);
}