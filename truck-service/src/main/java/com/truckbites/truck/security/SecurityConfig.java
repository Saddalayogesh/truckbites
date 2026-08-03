package com.truckbites.truck.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtValidationFilter jwtValidationFilter;

    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.debug("Configuring HTTP security for truck-service");
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .securityMatcher("/api/**")
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/trucks/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/trucks/*").permitAll()
                        .requestMatchers("/api/trucks/all").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/truck/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtValidationFilter, UsernamePasswordAuthenticationFilter.class);

        log.debug("HTTP security configured for truck-service");
        return http.build();
    }
}
