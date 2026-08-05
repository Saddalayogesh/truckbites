package com.truckbites.user.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Fetches the amount actually captured against a Razorpay order so the plan
 * subscription can confirm the customer paid the full plan price — not just
 * that a payment happened. Guards against paying a token amount (e.g. ₹1)
 * and then claiming a ₹999 plan.
 */
@Slf4j
@Component
public class RazorpayOrderAmountVerifier {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    /** Returns true when the Razorpay order was captured for {@code expectedPaise}. */
    public boolean matches(String razorpayOrderId, long expectedPaise) {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            log.error("Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
            return false;
        }
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            Order order = client.orders.fetch(razorpayOrderId);
            Object amount = order.get("amount");
            boolean matches = amount != null && ((Number) amount).longValue() == expectedPaise;
            log.info("Razorpay order amount check: orderId={}, expected={}, actual={}, matches={}",
                    razorpayOrderId, expectedPaise, amount, matches);
            return matches;
        } catch (RazorpayException e) {
            log.error("Failed to fetch Razorpay order amount for orderId={}", razorpayOrderId, e);
            return false;
        }
    }
}
