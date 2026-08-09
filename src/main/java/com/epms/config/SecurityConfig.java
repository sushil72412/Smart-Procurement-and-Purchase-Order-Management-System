package com.epms.config;

import com.epms.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
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

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // Disable CSRF because this is a REST API
                .csrf(csrf -> csrf.disable())

                // JWT based authentication
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Login doesn't require JWT
                        .requestMatchers("/api/auth/**")
                        .permitAll()

                        // Only ADMIN can manage users
                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")

                        // ADMIN and MANAGER can access products
                        .requestMatchers("/api/products/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                        // Employees and managers can access purchase requests
                        .requestMatchers("/api/purchase-requests/**")
                        .hasAnyRole("EMPLOYEE", "MANAGER")

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                // Add JWT filter before Spring's username/password filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // Keep HTTP Basic disabled
                .httpBasic(httpBasic -> {});

        return http.build();
    }
}