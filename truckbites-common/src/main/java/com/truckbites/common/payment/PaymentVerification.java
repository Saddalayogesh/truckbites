package com.truckbites.common.payment;

import com.truckbites.common.exception.BadRequestException;

/**
 * Shared UPI payment-verification helpers used by the microservices that accept
 * payments (orders, plan subscriptions, truck promotions).
 * <p>
 * This is a clearly-marked mock: the "gateway" verifies a payment only when the
 * customer supplied a valid UPI transaction reference (UTR) — 6-30
 * letters/numbers/dashes. Replace with a real gateway (e.g. Razorpay/PhonePe)
 * verification call when integrating one.
 */
public final class PaymentVerification {

    /** UTR format accepted by the mock gateway (same rule as payment-service). */
    private static final String UTR_PATTERN = "^[A-Za-z0-9-]{6,30}$";

    public static final String VERIFICATION_MESSAGE =
            "Payment could not be verified. Enter the UPI transaction ID (UTR) " +
            "from your payment app (6+ letters/numbers).";

    private PaymentVerification() {
    }

    public static boolean isValidUtr(String transactionRef) {
        return transactionRef != null && transactionRef.trim().matches(UTR_PATTERN);
    }

    /**
     * Verifies the supplied UTR, throwing {@link BadRequestException} (HTTP 400)
     * when the payment cannot be verified.
     */
    public static void requireValidUtr(String transactionRef) {
        if (!isValidUtr(transactionRef)) {
            throw new BadRequestException(VERIFICATION_MESSAGE);
        }
    }
}
