package com.truckbites.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared JWT validation filter used by every TruckBites microservice.
 *
 * <p>Parses the {@code Authorization: Bearer <token>} header, validates the
 * token, and populates the security context with a {@link UserPrincipal}
 * so controllers can reliably extract the authenticated user's ID.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtValidationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String token = authHeader.substring(7);
            final String userEmail = jwtUtil.extractUsername(token);
            final String userRole = jwtUtil.extractRole(token);
            final Long userId = jwtUtil.extractUserId(token);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtUtil.isTokenValid(token, userEmail)) {
                    if (userRole == null) {
                        log.warn("No role found in JWT token for user: {}", userEmail);
                        sendUnauthorizedResponse(response, "Invalid token: no role claim");
                        return;
                    }
                    String role = "ROLE_" + userRole;
                    UserPrincipal principal = new UserPrincipal(userEmail, userId);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority(role))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    log.warn("JWT token is invalid for user: {}", userEmail);
                    sendUnauthorizedResponse(response, "JWT token is expired or invalid. Please obtain a new token.");
                    return;
                }
            }
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired: {}", e.getMessage());
            sendUnauthorizedResponse(response, "JWT token has expired. Please obtain a new token.");
            return;
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token: {}", e.getMessage());
            sendUnauthorizedResponse(response, "JWT token is malformed. Please provide a valid token.");
            return;
        } catch (SignatureException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
            sendUnauthorizedResponse(response, "JWT token has an invalid signature. Token may have been tampered with.");
            return;
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token: {}", e.getMessage());
            sendUnauthorizedResponse(response, "JWT token format is not supported.");
            return;
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
            sendUnauthorizedResponse(response, "JWT token is missing required claims.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Sends a 401 Unauthorized response with a JSON body containing
     * the error details and a meaningful message.
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Unauthorized");
        body.put("message", message);

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
