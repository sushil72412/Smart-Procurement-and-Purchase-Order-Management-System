package com.epms.service.impl;

import com.epms.dto.CreateUserRequest;
import com.epms.dto.UpdateUserRequest;
import com.epms.dto.UserResponse;
import com.epms.entity.User;
import com.epms.repository.UserRepository;
import com.epms.service.UserService;
import com.epms.util.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists.");
        }

        // Convert DTO to Entity
        User user = UserMapper.toEntity(request);

        // Encrypt password
        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        user.setPassword(encryptedPassword);

        // Save user
        User savedUser = userRepository.save(user);

        // Return response
        return UserMapper.toResponse(savedUser);
    }

    @Override
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));

        UserMapper.updateEntity(existingUser, request);

        User updatedUser = userRepository.save(existingUser);

        return UserMapper.toResponse(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));

        userRepository.delete(user);
    }
}