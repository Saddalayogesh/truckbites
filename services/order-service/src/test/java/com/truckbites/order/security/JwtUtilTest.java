package com.truckbites.order.security;

import com.truckbites.common.security.JwtUtil;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private static final String TEST_SECRET = "b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
    }

    private String createToken(String email, String role, long expirationMillis) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    @DisplayName("Should extract username from valid token")
    void extractUsername_shouldReturnEmail() {
        String token = createToken("user@example.com", "CUSTOMER", 3600000);
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("Should extract role from valid token")
    void extractRole_shouldReturnRole() {
        String token = createToken("vendor@example.com", "VENDOR", 3600000);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("VENDOR");
    }

    @Test
    @DisplayName("Should return true for valid non-expired token")
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = createToken("user@example.com", "CUSTOMER", 3600000);
        assertThat(jwtUtil.isTokenValid(token, "user@example.com")).isTrue();
    }

    @Test
    @DisplayName("Should return false when username does not match")
    void isTokenValid_shouldReturnFalseWhenUsernameMismatch() {
        String token = createToken("user@example.com", "CUSTOMER", 3600000);
        assertThat(jwtUtil.isTokenValid(token, "other@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should return false for expired token")
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        String token = createToken("user@example.com", "CUSTOMER", -1000);
        assertThat(jwtUtil.isTokenValid(token, "user@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should extract ADMIN role from token")
    void extractRole_shouldReturnAdmin() {
        String token = createToken("admin@example.com", "ADMIN", 3600000);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ADMIN");
    }
}
