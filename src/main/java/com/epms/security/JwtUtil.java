package com.epms.security;

import org.springframework.stereotype.Component;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key = Keys.hmacShaKeyFor(
            "ThisIsMySecretKeyForEnterpriseProcurementSystem2026".getBytes()
    );

    private final long EXPIRATION_TIME =
            1000 * 60 * 60 * 24;

    public String generateToken(String email) {

        return Jwts.builder()

                .subject(email)

                .issuedAt(new Date())

                .expiration(
                        new Date(
                                System.currentTimeMillis() + EXPIRATION_TIME
                        )
                )

                .signWith(key, SignatureAlgorithm.HS256)

                .compact();
    }

}