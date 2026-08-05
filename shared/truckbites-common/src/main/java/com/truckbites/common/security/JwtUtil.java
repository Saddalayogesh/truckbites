package com.truckbites.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * Shared JWT utility used by every TruckBites microservice.
 *
 * <p>The {@code jwt.expiration} property has a sensible default so services that
 * only <em>validate</em> tokens (and therefore never generate them) do not need
 * to define it. auth-service overrides it in its own configuration.</p>
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    public String generateToken(String email, String role, Long userId) {
        log.debug("Generating JWT token for email: {} with role: {} and userId: {}", email, role, userId);
        String token = Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
        log.debug("JWT token generated successfully for email: {}", email);
        return token;
    }

    public String generateRefreshToken(String email) {
        log.debug("Generating refresh token for email: {}", email);
        // Include a unique jti claim: without it, two tokens generated for the same
        // email within the same second would be byte-identical, violating the
        // refresh_tokens.token unique constraint on login/register.
        String token = Jwts.builder()
                .setSubject(email)
                .claim("jti", UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 7)) // 7 days
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
        log.debug("Refresh token generated for email: {}", email);
        return token;
    }

    public String extractUsername(String token) {
        log.debug("Extracting username from JWT token");
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        log.debug("Extracting role from JWT token");
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public Long extractUserId(String token) {
        log.debug("Extracting userId from JWT token");
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, String userEmail) {
        log.debug("Validating JWT token for email: {}", userEmail);
        try {
            final String username = extractUsername(token);
            boolean valid = (username.equals(userEmail)) && !isTokenExpired(token);
            log.debug("Token validation result for {}: {}", userEmail, valid);
            return valid;
        } catch (ExpiredJwtException e) {
            log.warn("Token is expired for email: {}", userEmail);
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        boolean expired = extractExpiration(token).before(new Date());
        if (expired) {
            log.warn("JWT token is expired");
        }
        return expired;
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        log.debug("Parsing JWT token claims");
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        log.debug("Building signing key from secret");
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
