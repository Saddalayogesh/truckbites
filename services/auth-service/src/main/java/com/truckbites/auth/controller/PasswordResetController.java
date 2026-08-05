package com.truckbites.auth.controller;

import com.truckbites.auth.dto.ForgotPasswordRequest;
import com.truckbites.auth.dto.ResetPasswordRequest;
import com.truckbites.auth.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public authentication endpoints for user registration and login")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request password reset",
            description = "Sends a password reset token to the registered email address."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reset token generated (check email)",
                    content = @Content(schema = @Schema(example = "{\"message\": \"If the email exists, a reset link has been sent.\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid email format")
    })
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request for email: {}", request.getEmail());
        String token = passwordResetService.forgotPassword(request.getEmail());
        log.info("Password reset token generated");
        // In production, send this token via email. For now, return it for easy testing.
        return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a reset link has been sent.",
                "resetToken", token
        ));
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset password using token",
            description = "Resets the password using a valid reset token received via email."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset successful"),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Invalid, used, or expired token")
    })
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Password reset request with token");
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        log.info("Password reset successful");
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }
}
