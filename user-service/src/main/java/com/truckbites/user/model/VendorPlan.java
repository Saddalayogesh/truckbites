package com.truckbites.user.model;

import lombok.Getter;

import java.math.BigDecimal;

/**
 * Vendor subscription plans with monthly pricing, commission rate and benefits.
 */
@Getter
public enum VendorPlan {

    FREE(BigDecimal.ZERO, 10, "Free", "Basic listing"),
    STARTER(new BigDecimal("499.00"), 8, "Starter",
            "Unlimited menu updates, Order Management"),
    PRO(new BigDecimal("999.00"), 6, "Pro",
            "Analytics, Priority Support, Promotions"),
    PREMIUM(new BigDecimal("1499.00"), 5, "Premium",
            "Featured Listing, Advanced Analytics, Premium Support");

    private final BigDecimal monthlyPrice;
    private final int commissionPercent;
    private final String displayName;
    private final String benefits;

    VendorPlan(BigDecimal monthlyPrice, int commissionPercent, String displayName, String benefits) {
        this.monthlyPrice = monthlyPrice;
        this.commissionPercent = commissionPercent;
        this.displayName = displayName;
        this.benefits = benefits;
    }
}
