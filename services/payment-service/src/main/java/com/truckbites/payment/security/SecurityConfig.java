package com.truckbites.payment.security;

import com.truckbites.common.security.JwtValidationFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import java.time.LocalDateTime;import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtValidationFilter jwtValidationFilter;

    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        log.debug("Configuring HTTP security for payment-service");
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .securityMatcher("/api/**")
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint(objectMapper)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/payments/order/*").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtValidationFilter, UsernamePasswordAuthenticationFilter.class);

        log.debug("HTTP security configured for payment-service");
        return http.build();
    }

    /**
     * Returns a 401 Unauthorized response with a JSON body
     * when a request lacks valid authentication credentials.
     */
    private AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> {
            log.warn("Authentication failed: {}", authException.getMessage());
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("timestamp", LocalDateTime.now().toString());
            body.put("status", HttpStatus.UNAUTHORIZED.value());
            body.put("error", "Authentication required");
            body.put("message", "Full authentication is required to access this resource. " +
                    "Provide a valid JWT token in the Authorization header (Bearer <token>).");
            body.put("path", request.getRequestURI());

            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }


}
