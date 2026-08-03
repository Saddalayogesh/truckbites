package com.truckbites.user.controller;

import com.truckbites.user.dto.MembershipResponse;
import com.truckbites.user.dto.VendorPlanResponse;
import com.truckbites.user.model.MembershipTier;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.model.VendorPlan;
import com.truckbites.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import com.truckbites.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/membership")
    @Operation(
            summary = "Get customer membership",
            description = "Returns the membership status and benefits for a user. " +
                    "Public read endpoint used by other services (Feign) and the checkout flow."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Membership retrieved successfully",
                    content = @Content(schema = @Schema(implementation = MembershipResponse.class)))
    })
    public ResponseEntity<MembershipResponse> getMembership(
            @Parameter(description = "User ID", example = "1", required = true)
            @RequestParam Long userId) {
        log.info("Get membership for userId: {}", userId);
        return ResponseEntity.ok(userService.getMembership(userId));
    }

    @PostMapping("/membership")
    @Operation(
            summary = "Subscribe to a membership tier",
            description = "Activates (or upgrades) the authenticated customer's membership tier for one month. " +
                    "Renewing the same tier extends from the current expiry date. " +
                    "The userId is taken from the JWT, never from the request."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Membership activated",
                    content = @Content(schema = @Schema(implementation = MembershipResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid membership tier"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<MembershipResponse> subscribeMembership(
            @Parameter(description = "Membership tier to subscribe to", example = "GOLD", required = true,
                    schema = @Schema(allowableValues = {"SILVER", "GOLD", "PLATINUM"}))
            @RequestParam MembershipTier tier,
            Authentication authentication) {
        Long userId = extractUserId(authentication);
        log.info("Subscribe membership: userId={}, tier={}", userId, tier);
        if (tier == MembershipTier.NONE) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.subscribeMembership(userId, tier));
    }

    @GetMapping("/vendor-plan")
    @Operation(
            summary = "Get vendor plan",
            description = "Returns the vendor subscription plan and commission rate for a user. " +
                    "Public read endpoint used by other services (Feign) and the vendor dashboard."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vendor plan retrieved successfully",
                    content = @Content(schema = @Schema(implementation = VendorPlanResponse.class)))
    })
    public ResponseEntity<VendorPlanResponse> getVendorPlan(
            @Parameter(description = "User ID", example = "1", required = true)
            @RequestParam Long userId) {
        log.info("Get vendor plan for userId: {}", userId);
        return ResponseEntity.ok(userService.getVendorPlan(userId));
    }

    @PostMapping("/vendor-plan")
    @Operation(
            summary = "Subscribe to a vendor plan",
            description = "Activates (or upgrades) the authenticated vendor's subscription plan for one month. " +
                    "Renewing the same plan extends from the current expiry date. " +
                    "Requires VENDOR or ADMIN role; the userId is taken from the JWT."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vendor plan activated",
                    content = @Content(schema = @Schema(implementation = VendorPlanResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid vendor plan"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Requires VENDOR or ADMIN role")
    })
    public ResponseEntity<VendorPlanResponse> subscribeVendorPlan(
            @Parameter(description = "Vendor plan to subscribe to", example = "PRO", required = true,
                    schema = @Schema(allowableValues = {"STARTER", "PRO", "PREMIUM"}))
            @RequestParam VendorPlan plan,
            Authentication authentication) {
        checkVendorOrAdminRole(authentication);
        Long userId = extractUserId(authentication);
        log.info("Subscribe vendor plan: userId={}, plan={}", userId, plan);
        if (plan == VendorPlan.FREE) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.subscribeVendorPlan(userId, plan));
    }

    /**
     * Extracts the user ID from the JWT principal.
     */
    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal.userId();
        }
        throw new AccessDeniedException("Authentication required");
    }

    /**
     * Ensures the authenticated user has VENDOR or ADMIN role.
     */
    private void checkVendorOrAdminRole(Authentication authentication) {
        boolean allowed = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VENDOR") || auth.equals("ROLE_ADMIN"));
        if (!allowed) {
            throw new AccessDeniedException("Only VENDOR or ADMIN users can subscribe to vendor plans");
        }
    }
}
