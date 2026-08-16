package com.epms.config;

import com.epms.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // REST API - CSRF disabled
                .csrf(csrf -> csrf.disable())

                // JWT authentication is stateless
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Login
                        .requestMatchers("/api/auth/**")
                        .permitAll()

                        // User management
                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")

                        // Product management/access
                        .requestMatchers("/api/products/**")
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER"
                        )

                        // Purchase requests
                        .requestMatchers(
                                "/api/purchase-requests/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "EMPLOYEE"
                        )

                        // Supplier management
                        .requestMatchers("/api/suppliers/**")
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "SUPPLIER"
                        )

                        // Delivery management
                        .requestMatchers("/api/deliveries/**")
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "EMPLOYEE",
                                "SUPPLIER"
                        )

                        // Everything else
                        .anyRequest()
                        .authenticated()
                )

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // HTTP Basic disabled
                .httpBasic(httpBasic -> {});

        return http.build();
    }
}