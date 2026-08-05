package com.truckbites.user.model;

import lombok.Getter;

import java.math.BigDecimal;

/**
 * Customer membership tiers with their monthly pricing and order benefits.
 * <ul>
 *   <li>NONE     - 0/month, 15 platform fee per order, 0% discount, no coupons, no priority</li>
 *   <li>SILVER   - 49/month, 5 platform fee per order, 3% discount, 1 free coupon/month</li>
 *   <li>GOLD     - 99/month, free platform fee, 5% discount, 2 free coupons/month, priority processing</li>
 *   <li>PLATINUM - 149/month, free platform fee, 8% discount, 4 free coupons/month, priority processing</li>
 * </ul>
 */
@Getter
public enum MembershipTier {

    NONE(BigDecimal.ZERO, new BigDecimal("15.00"), 0, 0, false, "Non-Member"),
    SILVER(new BigDecimal("49.00"), new BigDecimal("5.00"), 3, 1, false, "Silver"),
    GOLD(new BigDecimal("99.00"), BigDecimal.ZERO, 5, 2, true, "Gold"),
    PLATINUM(new BigDecimal("149.00"), BigDecimal.ZERO, 8, 4, true, "Platinum");

    /** Monthly subscription price in INR. */
    private final BigDecimal monthlyPrice;

    /** Platform fee charged per successful order in INR. */
    private final BigDecimal platformFeePerOrder;

    /** Flat discount applied to the food subtotal. */
    private final int discountPercent;

    /** Free drink/dessert coupons granted each billing month. */
    private final int freeCouponsPerMonth;

    /** Whether orders from this tier get priority processing. */
    private final boolean priorityProcessing;

    /** Human friendly display name. */
    private final String displayName;

    MembershipTier(BigDecimal monthlyPrice, BigDecimal platformFeePerOrder, int discountPercent,
                   int freeCouponsPerMonth, boolean priorityProcessing, String displayName) {
        this.monthlyPrice = monthlyPrice;
        this.platformFeePerOrder = platformFeePerOrder;
        this.discountPercent = discountPercent;
        this.freeCouponsPerMonth = freeCouponsPerMonth;
        this.priorityProcessing = priorityProcessing;
        this.displayName = displayName;
    }
}
