package com.truckbites.user.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a user's profile information.
 * Stores phone, address, and profile image URL for each user.
 */
@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User profile information")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Unique profile identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Schema(description = "User ID this profile belongs to", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long userId;

    @Schema(description = "Phone number", example = "+1-555-123-4567")
    private String phone;

    @Schema(description = "Street address", example = "123 Main St, New York, NY 10001")
    private String address;

    @Schema(description = "URL to profile image", example = "https://example.com/images/profile.jpg")
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    @Schema(description = "Customer membership tier", example = "NONE",
            allowableValues = {"NONE", "SILVER", "GOLD", "PLATINUM"})
    private MembershipTier membershipTier = MembershipTier.NONE;

    @Schema(description = "When the current membership expires", example = "2026-09-03T10:00:00")
    private LocalDateTime membershipExpiresAt;

    @Column(nullable = false)
    @Builder.Default
    @Schema(description = "Free drink/dessert coupons remaining this billing cycle", example = "0")
    private Integer membershipCouponsRemaining = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    @Schema(description = "Vendor subscription plan", example = "FREE",
            allowableValues = {"FREE", "STARTER", "PRO", "PREMIUM"})
    private VendorPlan vendorPlan = VendorPlan.FREE;

    @Schema(description = "When the current vendor plan expires", example = "2026-09-03T10:00:00")
    private LocalDateTime vendorPlanExpiresAt;
}
