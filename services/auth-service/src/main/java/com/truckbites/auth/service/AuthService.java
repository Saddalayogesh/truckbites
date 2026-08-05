package com.truckbites.auth.service;

import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RefreshTokenRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.dto.UserAdminResponse;
import com.truckbites.auth.model.RefreshToken;
import com.truckbites.auth.model.Role;
import com.truckbites.auth.model.User;
import com.truckbites.auth.repository.RefreshTokenRepository;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.security.JwtUtil;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthResponse register(RegisterRequest request) {
        log.debug("Checking if email already exists: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: email already registered - {}", request.getEmail());
            throw new UnauthorizedException("Email already registered");
        }

        // Security: public registration can NEVER choose its own role.
        // All new accounts are CUSTOMER; roles are only assigned by an ADMIN
        // via PUT /api/auth/users/{id}/role.
        Role role = Role.CUSTOMER;

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);
        log.debug("User saved to database: id={}, email={}", user.getId(), user.getEmail());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        saveRefreshToken(user.getId(), refreshToken);
        log.debug("JWT token generated for user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getId())
                .role(user.getRole())
                .build();
    }

    /**
     * Update a user's role (ADMIN only).
     *
     * @param userId  the ID of the user to update
     * @param newRole the new role to assign
     * @return updated user details
     */
    @Transactional
    public UserAdminResponse updateUserRole(Long userId, Role newRole) {
        log.info("Updating role for user id={} to {}", userId, newRole);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });

        user.setRole(newRole);
        userRepository.save(user);
        log.info("Role updated successfully for user id={} to {}", userId, newRole);

        return UserAdminResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<UserAdminResponse> getAllUsers() {
        log.debug("Fetching all users for admin");
        return userRepository.findAll()
                .stream()
                .map(user -> UserAdminResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
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

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        saveRefreshToken(user.getId(), refreshToken);
        log.debug("JWT token generated for user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getId())
                .role(user.getRole())
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        RefreshToken storedToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> {
                    log.warn("Refresh token not found");
                    return new UnauthorizedException("Invalid refresh token");
                });

        if (storedToken.isRevoked()) {
            log.warn("Refresh token has been revoked");
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh token has expired");
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new UnauthorizedException("Refresh token has expired");
        }

        // Rotate: revoke old token and issue new ones
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        saveRefreshToken(user.getId(), newRefreshToken);

        log.info("Token refreshed for userId: {}", user.getId());

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getId())
                .role(user.getRole())
                .build();
    }

    private void saveRefreshToken(Long userId, String token) {
        RefreshToken rt = RefreshToken.builder()
                .token(token)
                .userId(userId)
                .revoked(false)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();
        refreshTokenRepository.save(rt);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.info("User logged out, refresh tokens cleared for userId: {}", userId);
    }
}
