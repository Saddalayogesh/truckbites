package com.truckbites.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response containing a customer's membership status and benefits.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Customer membership status and benefits")
public class MembershipResponse {

    @Schema(description = "Membership tier", example = "GOLD",
            allowableValues = {"NONE", "SILVER", "GOLD", "PLATINUM"})
    private String tier;

    @Schema(description = "Display name of the tier", example = "Gold")
    private String displayName;

    @Schema(description = "Whether the membership is currently active", example = "true")
    private boolean active;

    @Schema(description = "Monthly subscription price in INR", example = "99.00")
    private BigDecimal monthlyPrice;

    @Schema(description = "Platform fee charged per successful order in INR", example = "0.00")
    private BigDecimal platformFeePerOrder;

    @Schema(description = "Flat discount applied to the food subtotal", example = "5")
    private int discountPercent;

    @Schema(description = "Free drink/dessert coupons granted each month", example = "2")
    private int freeCouponsPerMonth;

    @Schema(description = "Free coupons still available this billing cycle", example = "2")
    private int couponsRemaining;

    @Schema(description = "Whether orders get priority processing", example = "true")
    private boolean priorityProcessing;

    @Schema(description = "When the current membership expires", example = "2026-09-03T10:00:00")
    private LocalDateTime expiresAt;
}
