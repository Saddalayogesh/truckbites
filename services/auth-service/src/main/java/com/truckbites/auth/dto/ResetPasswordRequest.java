package com.truckbites.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Reset password request payload")
public class ResetPasswordRequest {

    @NotBlank(message = "Token is required")
    @Schema(description = "Password reset token received via email", example = "abc123-def456", requiredMode = Schema.RequiredMode.REQUIRED)
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "New password (minimum 6 characters)", example = "newSecurePass123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String newPassword;
}
