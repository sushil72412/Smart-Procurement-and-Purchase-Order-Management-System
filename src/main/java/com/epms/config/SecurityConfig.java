package com.epms.config;

import com.epms.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // -------------------------------------------------
                // CSRF
                // -------------------------------------------------
                .csrf(csrf -> csrf.disable())

                // -------------------------------------------------
                // STATELESS SESSION
                // -------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // -------------------------------------------------
                // AUTHORIZATION RULES
                // -------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // =========================================
                        // AUTHENTICATION
                        // =========================================

                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()


                        // =========================================
                        // USER MANAGEMENT
                        // =========================================

                        .requestMatchers(
                                "/api/users/**"
                        )
                        .hasRole("ADMIN")


                        // =========================================
                        // PRODUCT MANAGEMENT
                        // =========================================

                        .requestMatchers(
                                "/api/products/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER"
                        )


                        // =========================================
                        // PURCHASE REQUESTS
                        // =========================================

                        .requestMatchers(
                                "/api/purchase-requests/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "EMPLOYEE"
                        )


                        // =========================================
                        // SUPPLIERS
                        // =========================================

                        .requestMatchers(
                                "/api/suppliers/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "SUPPLIER"
                        )


                        // =========================================
                        // DELIVERIES
                        // =========================================

                        .requestMatchers(
                                "/api/deliveries/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "EMPLOYEE",
                                "SUPPLIER"
                        )


                        // =========================================
                        // CREATE RATING
                        // EMPLOYEE ONLY
                        // =========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/ratings"
                        )
                        .hasRole("EMPLOYEE")


                        // =========================================
                        // EVERYTHING ELSE
                        // =========================================

                        .anyRequest()
                        .authenticated()
                )

                // -------------------------------------------------
                // JWT FILTER
                // -------------------------------------------------

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // -------------------------------------------------
                // HTTP BASIC DISABLED
                // -------------------------------------------------

                .httpBasic(
                        httpBasic -> httpBasic.disable()
                );

        return http.build();
    }
}