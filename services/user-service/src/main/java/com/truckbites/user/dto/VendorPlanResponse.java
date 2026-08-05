package com.truckbites.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response containing a vendor's subscription plan and commission rate.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Vendor subscription plan status and benefits")
public class VendorPlanResponse {

    @Schema(description = "Vendor plan", example = "PRO",
            allowableValues = {"FREE", "STARTER", "PRO", "PREMIUM"})
    private String plan;

    @Schema(description = "Display name of the plan", example = "Pro")
    private String displayName;

    @Schema(description = "Whether the plan is currently active", example = "true")
    private boolean active;

    @Schema(description = "Monthly subscription price in INR", example = "999.00")
    private BigDecimal monthlyPrice;

    @Schema(description = "Commission percentage charged on every successful order", example = "6")
    private int commissionPercent;

    @Schema(description = "Concise description of included benefits", example = "Analytics, Priority Support, Promotions")
    private String benefits;

    @Schema(description = "When the current plan expires", example = "2026-09-03T10:00:00")
    private LocalDateTime expiresAt;
}
