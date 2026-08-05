package com.truckbites.payment.security;

import com.truckbites.common.security.JwtUtil;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtUtil Unit Tests")
class JwtUtilTest {

    private static final String SECRET = "b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";
    private static final String TEST_EMAIL = "test@truckbites.com";
    private static final String TEST_ROLE = "CUSTOMER";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
    }

    private String createToken(String email, String role, long expirationMs) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Nested
    @DisplayName("extractUsername()")
    class ExtractUsername {

        @Test
        @DisplayName("should extract email from subject claim")
        void shouldExtractEmail() {
            // Given
            String token = createToken(TEST_EMAIL, TEST_ROLE, 3600000);

            // When
            String extracted = jwtUtil.extractUsername(token);

            // Then
            assertThat(extracted).isEqualTo(TEST_EMAIL);
        }
    }

    @Nested
    @DisplayName("extractRole()")
    class ExtractRole {

        @Test
        @DisplayName("should extract role from custom claim")
        void shouldExtractRole() {
            // Given
            String token = createToken(TEST_EMAIL, TEST_ROLE, 3600000);

            // When
            String extracted = jwtUtil.extractRole(token);

            // Then
            assertThat(extracted).isEqualTo(TEST_ROLE);
        }

        @Test
        @DisplayName("should return null when no role claim")
        void shouldReturnNullWhenNoRoleClaim() {
            // Given
            String token = Jwts.builder()
                    .setSubject(TEST_EMAIL)
                    .setIssuedAt(new Date(System.currentTimeMillis()))
                    .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                    .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                    .compact();

            // When
            String extracted = jwtUtil.extractRole(token);

            // Then
            assertThat(extracted).isNull();
        }
    }

    @Nested
    @DisplayName("isTokenValid()")
    class IsTokenValid {

        @Test
        @DisplayName("should return true for valid non-expired token")
        void shouldReturnTrueForValidToken() {
            // Given
            String token = createToken(TEST_EMAIL, TEST_ROLE, 3600000);

            // When
            boolean valid = jwtUtil.isTokenValid(token, TEST_EMAIL);

            // Then
            assertThat(valid).isTrue();
        }

        @Test
        @DisplayName("should return false for expired token")
        void shouldReturnFalseForExpiredToken() {
            // Given
            String token = createToken(TEST_EMAIL, TEST_ROLE, -3600000); // expired 1 hour ago

            // When
            boolean valid = jwtUtil.isTokenValid(token, TEST_EMAIL);

            // Then
            assertThat(valid).isFalse();
        }

        @Test
        @DisplayName("should return false when email does not match")
        void shouldReturnFalseWhenEmailDoesNotMatch() {
            // Given
            String token = createToken(TEST_EMAIL, TEST_ROLE, 3600000);

            // When
            boolean valid = jwtUtil.isTokenValid(token, "other@truckbites.com");

            // Then
            assertThat(valid).isFalse();
        }
    }
}
