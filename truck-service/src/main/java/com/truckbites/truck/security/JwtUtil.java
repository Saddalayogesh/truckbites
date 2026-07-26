package com.truckbites.truck.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    public String extractUsername(String token) {
        log.debug("Extracting username from JWT token");
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        log.debug("Extracting role from JWT token");
        return extractClaim(token, claims -> claims.get("role", String.class));
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
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
