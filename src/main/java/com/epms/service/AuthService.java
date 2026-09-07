package com.epms.service;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.LoginRequest;
import com.epms.dto.LoginResponse;
import com.epms.dto.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserResponse register(CreateUserRequest request);
}