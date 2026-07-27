package com.truckbites.analytics.security;

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

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A47";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
    }

    private String createToken(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    @DisplayName("Should extract username from token")
    void extractUsername_shouldReturnEmail() {
        String token = createToken("vendor@test.com", "VENDOR");
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("vendor@test.com");
    }

    @Test
    @DisplayName("Should extract VENDOR role from token")
    void extractRole_shouldReturnVendor() {
        String token = createToken("vendor@test.com", "VENDOR");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("VENDOR");
    }

    @Test
    @DisplayName("Should validate token when email matches and not expired")
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = createToken("vendor@test.com", "VENDOR");
        assertThat(jwtUtil.isTokenValid(token, "vendor@test.com")).isTrue();
    }

    @Test
    @DisplayName("Should return false when email does not match")
    void isTokenValid_shouldReturnFalseWhenEmailMismatch() {
        String token = createToken("vendor@test.com", "VENDOR");
        assertThat(jwtUtil.isTokenValid(token, "other@test.com")).isFalse();
    }

    @Test
    @DisplayName("Should return false for expired token")
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        String expiredToken = Jwts.builder()
                .setSubject("vendor@test.com")
                .claim("role", "VENDOR")
                .setIssuedAt(new Date(System.currentTimeMillis() - 3600000))
                .setExpiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        assertThat(jwtUtil.isTokenValid(expiredToken, "vendor@test.com")).isFalse();
    }
}
