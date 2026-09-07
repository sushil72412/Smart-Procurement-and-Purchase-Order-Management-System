package com.epms.service;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.LoginRequest;
import com.epms.dto.LoginResponse;
import com.epms.dto.UserResponse;
import com.epms.entity.User;
import com.epms.enums.Role;
import com.epms.repository.UserRepository;
import com.epms.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;


    public AuthServiceImpl(
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {

        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }


    // =========================================================
    // LOGIN
    // =========================================================

    @Override
    public LoginResponse login(LoginRequest request) {

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid email or password"
                        ));


        // Verify password
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        // Generate JWT token
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );


        // Return login response
        return new LoginResponse(
                token,
                user.getEmail(),
                user.getRole()
        );
    }


    // =========================================================
    // REGISTRATION
    // =========================================================

    @Override
    public UserResponse register(CreateUserRequest request) {

        // Force public registration to EMPLOYEE
        request.setRole(Role.EMPLOYEE);

        // Reuse existing user creation logic
        return userService.createUser(request);
    }
}