package com.truckbites.truck.security;

import com.truckbites.common.security.JwtUtil;

import io.jsonwebtoken.Claims;
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

    private JwtUtil jwtUtil;

    private static final String TEST_SECRET = "b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";

    private String createTestToken(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
    }

    @Test
    @DisplayName("Should extract username from token")
    void extractUsername_shouldReturnCorrectEmail() {
        // Arrange
        String email = "user@example.com";
        String token = createTestToken(email, "CUSTOMER");

        // Act
        String extractedEmail = jwtUtil.extractUsername(token);

        // Assert
        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("Should extract role from token")
    void extractRole_shouldReturnCorrectRole() {
        // Arrange
        String token = createTestToken("vendor@example.com", "VENDOR");

        // Act
        String role = jwtUtil.extractRole(token);

        // Assert
        assertThat(role).isEqualTo("VENDOR");
    }

    @Test
    @DisplayName("Should validate token with correct username")
    void isTokenValid_shouldReturnTrue_whenUsernameMatches() {
        // Arrange
        String email = "user@example.com";
        String token = createTestToken(email, "CUSTOMER");

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, email);

        // Assert
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should invalidate token with wrong username")
    void isTokenValid_shouldReturnFalse_whenUsernameDoesNotMatch() {
        // Arrange
        String token = createTestToken("user@example.com", "CUSTOMER");

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, "other@example.com");

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should invalidate expired token")
    void isTokenValid_shouldReturnFalse_whenTokenExpired() {
        // Arrange - generate a token that expired long ago
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        String expiredToken = Jwts.builder()
                .setSubject("expired@example.com")
                .claim("role", "CUSTOMER")
                .setIssuedAt(new Date(System.currentTimeMillis() - 86400000))
                .setExpiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        // Act
        boolean isValid = jwtUtil.isTokenValid(expiredToken, "expired@example.com");

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should extract claims from token")
    void extractClaim_shouldReturnCorrectValue() {
        // Arrange
        String email = "claims@example.com";
        String token = createTestToken(email, "ADMIN");

        // Act
        String subject = jwtUtil.extractClaim(token, Claims::getSubject);

        // Assert
        assertThat(subject).isEqualTo(email);
    }

    @Test
    @DisplayName("Should handle tokens with ADMIN role")
    void extractRole_shouldReturnAdminRole() {
        // Arrange
        String token = createTestToken("admin@example.com", "ADMIN");

        // Act
        String role = jwtUtil.extractRole(token);

        // Assert
        assertThat(role).isEqualTo("ADMIN");
    }
}
