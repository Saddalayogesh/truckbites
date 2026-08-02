package com.truckbites.auth.dto;

import com.truckbites.auth.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after successful authentication (register or login).
 * Contains the JWT token and basic user information.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Authentication response containing JWT token and user details")
public class AuthResponse {

    @Schema(
            description = "JWT Bearer token for authenticating subsequent API requests",
            example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNzg1MDY5MzU0LCJleHAiOjE3ODUxNTU3NTR9.rqHGNXSDrgJRx0diwK0A88UkmLL_enf6ygosmv-Q2zM"
    )
    private String token;

    @Schema(description = "Refresh token for obtaining new access tokens", example = "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...")
    private String refreshToken;

    @Schema(description = "Email address of the authenticated user", example = "john@example.com")
    private String email;

    @Schema(description = "Full name of the authenticated user", example = "John Doe")
    private String name;

    @Schema(description = "User ID", example = "1")
    private Long userId;

    @Schema(description = "User role for authorization", example = "CUSTOMER",
            allowableValues = {"CUSTOMER", "VENDOR", "ADMIN"})
    private Role role;
}
