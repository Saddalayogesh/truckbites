package com.truckbites.user.security;

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

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A47";

    private String createTestToken(String email) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
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
        String token = createTestToken(email);

        // Act
        String extractedEmail = jwtUtil.extractUsername(token);

        // Assert
        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("Should validate token with correct username")
    void isTokenValid_shouldReturnTrue_whenUsernameMatches() {
        // Arrange
        String email = "user@example.com";
        String token = createTestToken(email);

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, email);

        // Assert
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should invalidate token with wrong username")
    void isTokenValid_shouldReturnFalse_whenUsernameDoesNotMatch() {
        // Arrange
        String token = createTestToken("user@example.com");

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, "other@example.com");

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should invalidate expired token")
    void isTokenValid_shouldReturnFalse_whenTokenExpired() throws Exception {
        // Arrange - generate a token that expired long ago
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        String expiredToken = Jwts.builder()
                .setSubject("expired@example.com")
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
        String token = createTestToken(email);

        // Act
        String subject = jwtUtil.extractClaim(token, Claims::getSubject);

        // Assert
        assertThat(subject).isEqualTo(email);
    }
}
