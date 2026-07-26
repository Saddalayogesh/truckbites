package com.truckbites.auth.service;

import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.model.Role;
import com.truckbites.auth.model.User;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.auth.security.JwtUtil;
import com.truckbites.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        log.debug("Checking if email already exists: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: email already registered - {}", request.getEmail());
            throw new UnauthorizedException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .build();

        userRepository.save(user);
        log.debug("User saved to database: id={}, email={}", user.getId(), user.getEmail());

        String token = jwtUtil.generateToken(user.getEmail());
        log.debug("JWT token generated for user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.debug("Looking up user by email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: no user found for email: {}", request.getEmail());
                    return new UnauthorizedException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: incorrect password for email: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        log.debug("JWT token generated for user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
