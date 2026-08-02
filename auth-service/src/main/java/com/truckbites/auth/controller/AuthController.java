package com.truckbites.auth.controller;

import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RefreshTokenRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.dto.UpdateRoleRequest;
import com.truckbites.auth.dto.UserAdminResponse;
import com.truckbites.auth.service.AuthService;
import com.truckbites.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.List;

/**
 * REST controller for authentication operations.
 * Provides public endpoints for user registration and login.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public authentication endpoints for user registration and login")
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user account.
     *
     * @param request the registration details (name, email, password)
     * @return AuthResponse with JWT token, user email, name, and role
     */
    @PostMapping("/register")
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account with CUSTOMER role and returns a JWT token. " +
                    "The email must be unique. Password must be at least 6 characters."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed - invalid input"),
            @ApiResponse(responseCode = "401", description = "Email already registered")
    })
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request received for email: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        log.info("User registered successfully: email={}, role={}", response.getEmail(), response.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticate an existing user and return a JWT token.
     *
     * @param request the login credentials (email, password)
     * @return AuthResponse with JWT token, user email, name, and role
     */
    @PostMapping("/login")
    @Operation(
            summary = "Login with existing credentials",
            description = "Authenticates a user with email and password, returning a JWT token " +
                    "that can be used to authorize subsequent API requests."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful, JWT token returned",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed - invalid input"),
            @ApiResponse(responseCode = "401", description = "Invalid email or password")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        log.info("Login successful: email={}, role={}", response.getEmail(), response.getRole());
        return ResponseEntity.ok(response);
    }

    /**
     * Returns all registered users (ADMIN only).
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all users (ADMIN)",
            description = "Returns all registered users in the system. Restricted to ADMIN users."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of all users returned"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role")
    })
    public ResponseEntity<List<UserAdminResponse>> getAllUsers() {
        log.info("Get all users (admin)");
        return ResponseEntity.ok(authService.getAllUsers());
    }

    /**
     * Update a user's role (ADMIN only).
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update user role (ADMIN)",
            description = "Updates the role of a specific user. Restricted to ADMIN users."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User role updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserAdminResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        log.info("Update role request: userId={}, newRole={}", id, request.getRole());
        UserAdminResponse response = authService.updateUserRole(id, request.getRole());
        log.info("User role updated: userId={}, newRole={}", id, request.getRole());
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh an expired JWT token using a refresh token.
     */
    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh JWT token",
            description = "Exchanges a valid refresh token for a new JWT access token and a new refresh token (rotation)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Refresh token request received");
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout: revoke all refresh tokens for the user.
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revokes all refresh tokens for the authenticated user.")
    public ResponseEntity<Void> logout(Authentication authentication) {
        Long userId = extractUserId(authentication);
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal.userId();
        }
        return 0L;
    }
}
