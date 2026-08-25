package com.epms.security;

import com.epms.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY =
            "ThisIsMySecretKeyForEnterpriseProcurementSystem2026";

    private static final long EXPIRATION_TIME =
            1000L * 60 * 60 * 24; // 24 hours

    private final Key key = Keys.hmacShaKeyFor(
            SECRET_KEY.getBytes(StandardCharsets.UTF_8)
    );

    // =========================================================
    // Generate JWT
    // =========================================================

    public String generateToken(
            String email,
            Role role) {

        return Jwts.builder()
                .subject(email)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + EXPIRATION_TIME
                        )
                )
                .signWith(
                        key,
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    // =========================================================
    // Extract all claims
    // =========================================================

    public Claims extractAllClaims(
            String token) {

        return Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // =========================================================
    // Extract email
    // =========================================================

    public String extractEmail(
            String token) {

        return extractAllClaims(token)
                .getSubject();
    }

    // =========================================================
    // Extract role
    // =========================================================

    public String extractRole(
            String token) {

        return extractAllClaims(token)
                .get("role", String.class);
    }

    // =========================================================
    // Check token expiration
    // =========================================================

    public boolean isTokenExpired(
            String token) {

        Date expiration =
                extractAllClaims(token)
                        .getExpiration();

        return expiration.before(
                new Date()
        );
    }

    // =========================================================
    // Validate token
    // =========================================================

    public boolean validateToken(
            String token) {

        try {

            Claims claims =
                    extractAllClaims(token);

            Date expiration =
                    claims.getExpiration();

            return expiration != null
                    && expiration.after(new Date());

        } catch (Exception e) {

            System.out.println(
                    "JWT validation failed: "
                            + e.getMessage()
            );

            return false;
        }
    }
}