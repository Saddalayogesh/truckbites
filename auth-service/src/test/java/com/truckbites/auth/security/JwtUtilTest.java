package com.truckbites.auth.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A47";
    private static final long TEST_EXPIRATION = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", TEST_EXPIRATION);
    }

    @Test
    @DisplayName("Should generate a valid JWT token")
    void generateToken_shouldReturnValidToken() {
        // Act
        String token = jwtUtil.generateToken("test@example.com");

        // Assert
        assertThat(token).isNotNull().isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts (header, payload, signature)
    }

    @Test
    @DisplayName("Should extract username from token")
    void extractUsername_shouldReturnCorrectEmail() {
        // Arrange
        String email = "user@example.com";
        String token = jwtUtil.generateToken(email);

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
        String token = jwtUtil.generateToken(email);

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, email);

        // Assert
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should invalidate token with wrong username")
    void isTokenValid_shouldReturnFalse_whenUsernameDoesNotMatch() {
        // Arrange
        String token = jwtUtil.generateToken("user@example.com");

        // Act
        boolean isValid = jwtUtil.isTokenValid(token, "other@example.com");

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should generate valid JWT tokens with three parts")
    void generateToken_shouldProduceValidJwtStructure() throws Exception {
        // Arrange
        String token = jwtUtil.generateToken("test@example.com");

        // Act & Assert
        assertThat(token).isNotNull().isNotBlank();
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3); // header.payload.signature
        
        // Verify each part is base64-encoded (not empty)
        assertThat(parts[0]).isNotBlank();
        assertThat(parts[1]).isNotBlank();
        assertThat(parts[2]).isNotBlank();
    }

    @Test
    @DisplayName("Should extract claims from token")
    void extractClaim_shouldReturnCorrectValue() {
        // Arrange
        String email = "claims@example.com";
        String token = jwtUtil.generateToken(email);

        // Act
        String subject = jwtUtil.extractClaim(token, Claims::getSubject);

        // Assert
        assertThat(subject).isEqualTo(email);
    }
}
