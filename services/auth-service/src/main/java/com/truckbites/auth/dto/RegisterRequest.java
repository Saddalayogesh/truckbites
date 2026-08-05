package com.truckbites.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for new user registration.
 */
@Data
@Schema(description = "Registration details for a new user account")
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Full name of the user", example = "John Doe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Schema(description = "Email address (must be unique)", example = "john@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "Password (minimum 6 characters)", example = "password123", requiredMode = Schema.RequiredMode.REQUIRED, minLength = 6)
    private String password;

    // NOTE: No role field here on purpose. Public registration always creates a
    // CUSTOMER account; roles are only assigned by an ADMIN via the role-update
    // endpoint. Accepting a role here would be a privilege escalation.
}
