package com.truckbites.user.controller;

import com.truckbites.user.model.UserProfile;
import com.truckbites.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user profile management.
 * Requires authentication for all endpoints.
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profiles", description = "User profile management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(
            summary = "Get user profile",
            description = "Retrieves the profile details (phone, address, profile image) for a specific user."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfile.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "User profile not found")
    })
    public ResponseEntity<UserProfile> getProfile(
            @Parameter(description = "User ID", example = "1", required = true)
            @RequestParam Long userId) {
        log.info("Get profile request for userId: {}", userId);
        UserProfile profile = userService.getProfile(userId);
        log.debug("Profile retrieved for userId: {}", userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @Operation(
            summary = "Update user profile",
            description = "Updates the profile details (phone, address, profile image URL) for a specific user. " +
                    "Only provided fields will be updated; omitted fields retain their existing values."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserProfile.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserProfile> updateProfile(
            @Parameter(description = "User ID", example = "1", required = true)
            @RequestParam Long userId,
            @Parameter(description = "Phone number", example = "+1-555-123-4567")
            @RequestParam(required = false) @Size(max = 20) String phone,
            @Parameter(description = "Street address", example = "123 Main St, New York, NY 10001")
            @RequestParam(required = false) @Size(max = 255) String address,
            @Parameter(description = "URL to profile image", example = "https://example.com/images/profile.jpg")
            @RequestParam(required = false) @Size(max = 500) String profileImageUrl
    ) {
        log.info("Update profile request for userId: {}", userId);
        UserProfile profile = userService.updateProfile(userId, phone, address, profileImageUrl);
        log.info("Profile updated successfully for userId: {}", userId);
        return ResponseEntity.ok(profile);
    }
}
