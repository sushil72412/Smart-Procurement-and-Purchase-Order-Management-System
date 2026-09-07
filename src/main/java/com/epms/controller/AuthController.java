package com.epms.controller;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.LoginRequest;
import com.epms.dto.LoginResponse;
import com.epms.dto.UserResponse;
import com.epms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }

    @PostMapping("/register")
    public UserResponse register(
            @Valid @RequestBody CreateUserRequest request) {

        return authService.register(request);
    }

}