package com.truckbites.order.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Centralized pricing rules applied at checkout (revenue model).
 * <ul>
 *   <li>GST 5% on the food subtotal (restaurant category)</li>
 *   <li>GST 18% on the platform fee (digital services)</li>
 * </ul>
 * Membership fees/discounts and vendor commissions are resolved from
 * user-service at order time.
 */
public final class PricingRules {

    private PricingRules() {
    }

    public static final BigDecimal GST_FOOD_RATE = new BigDecimal("0.05");
    public static final BigDecimal GST_PLATFORM_FEE_RATE = new BigDecimal("0.18");
    public static final int SCALE = 2;

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    /** GST payable on a given pre-GST amount at the given rate. */
    public static BigDecimal gstOf(BigDecimal amount, BigDecimal rate) {
        return money(amount.multiply(rate));
    }
}
