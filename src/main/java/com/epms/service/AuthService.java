package com.epms.service;

import com.epms.dto.LoginRequest;
import com.epms.dto.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

}