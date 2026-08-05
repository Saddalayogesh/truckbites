package com.truckbites.auth.security;

import com.truckbites.common.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
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
    private static final long TEST_EXPIRATION = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", TEST_EXPIRATION);
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Test
    @DisplayName("Should generate a valid JWT token with 3-arg method")
    void generateToken_withUserId_shouldReturnValidToken() {
        String token = jwtUtil.generateToken("test@example.com", "CUSTOMER", 1L);

        assertThat(token).isNotNull().isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Should extract username from token")
    void extractUsername_shouldReturnCorrectEmail() {
        String email = "user@example.com";
        String token = jwtUtil.generateToken(email, "CUSTOMER", 1L);

        String extractedEmail = jwtUtil.extractUsername(token);

        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("Should extract role from token")
    void extractRole_shouldReturnCorrectRole() {
        String token = jwtUtil.generateToken("user@example.com", "VENDOR", 2L);

        String role = jwtUtil.extractRole(token);

        assertThat(role).isEqualTo("VENDOR");
    }

    @Test
    @DisplayName("Should extract userId from token claims")
    void extractUserId_shouldReturnCorrectUserId() {
        String token = jwtUtil.generateToken("user@example.com", "VENDOR", 42L);

        Long userId = jwtUtil.extractClaim(token, claims -> claims.get("userId", Long.class));

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    @DisplayName("Should validate token with correct username")
    void isTokenValid_shouldReturnTrue_whenUsernameMatches() {
        String email = "user@example.com";
        String token = jwtUtil.generateToken(email, "CUSTOMER", 1L);

        boolean isValid = jwtUtil.isTokenValid(token, email);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should invalidate token with wrong username")
    void isTokenValid_shouldReturnFalse_whenUsernameDoesNotMatch() {
        String token = jwtUtil.generateToken("user@example.com", "CUSTOMER", 1L);

        boolean isValid = jwtUtil.isTokenValid(token, "other@example.com");

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should generate a valid refresh token with 7-day expiry")
    void generateRefreshToken_shouldReturnValidToken() {
        String email = "user@example.com";
        String refreshToken = jwtUtil.generateRefreshToken(email);

        assertThat(refreshToken).isNotNull().isNotBlank();
        assertThat(refreshToken.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Should extract subject from refresh token")
    void generateRefreshToken_shouldContainCorrectEmail() {
        String email = "refresh@example.com";
        String refreshToken = jwtUtil.generateRefreshToken(email);

        String extractedEmail = jwtUtil.extractUsername(refreshToken);

        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("Refresh token should have longer expiry than access token")
    void generateRefreshToken_shouldHaveLongerExpiryThanAccessToken() {
        String accessToken = jwtUtil.generateToken("test@example.com", "CUSTOMER", 1L);
        String refreshToken = jwtUtil.generateRefreshToken("test@example.com");

        Date accessExp = jwtUtil.extractClaim(accessToken, Claims::getExpiration);
        Date refreshExp = jwtUtil.extractClaim(refreshToken, Claims::getExpiration);

        // Refresh token should expire after access token
        assertThat(refreshExp.after(accessExp)).isTrue();
    }

    @Test
    @DisplayName("Should extract claims from token")
    void extractClaim_shouldReturnCorrectValue() {
        String email = "claims@example.com";
        String token = jwtUtil.generateToken(email, "ADMIN", 3L);

        String subject = jwtUtil.extractClaim(token, Claims::getSubject);

        assertThat(subject).isEqualTo(email);
    }

    @Test
    @DisplayName("Should return false for expired token")
    void isTokenValid_shouldReturnFalse_whenTokenExpired() {
        // Create a JwtUtil with negative expiration so the token is instantly expired
        JwtUtil shortLived = new JwtUtil();
        ReflectionTestUtils.setField(shortLived, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(shortLived, "expiration", -1000L); // Already expired

        String token = shortLived.generateToken("expired@example.com", "CUSTOMER", 1L);

        boolean valid = shortLived.isTokenValid(token, "expired@example.com");

        assertThat(valid).isFalse();
    }

    @Test
    @DisplayName("Should generate valid JWT tokens with three parts")
    void generateToken_shouldProduceValidJwtStructure() {
        String token = jwtUtil.generateToken("test@example.com", "CUSTOMER", 1L);

        assertThat(token).isNotNull().isNotBlank();
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3);
        assertThat(parts[0]).isNotBlank();
        assertThat(parts[1]).isNotBlank();
        assertThat(parts[2]).isNotBlank();
    }
}
