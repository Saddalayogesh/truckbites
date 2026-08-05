package com.truckbites.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.truckbites.common.payment.RazorpayPaymentVerifier;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Thin wrapper around the official Razorpay Java SDK.
 * <p>
 * Creates Razorpay orders server-side (the returned order id drives the
 * frontend Checkout modal) and verifies the payment signature that Razorpay
 * produces in the browser after a successful payment.
 */
@Slf4j
@Service
public class RazorpayService {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    /** Result of a successful Razorpay order creation. */
    public record RazorpayOrderResult(String razorpayOrderId, long amountPaise, String currency, String keyId) {
    }

    /**
     * Creates a Razorpay order for the given amount (INR, converted to paise).
     */
    public RazorpayOrderResult createOrder(BigDecimal amount, String currency, String receipt, String description) {
        requireConfigured();
        try {
            String currencyCode = (currency != null && !currency.isBlank()) ? currency : "INR";
            long amountPaise = toPaise(amount);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", currencyCode);
            if (receipt != null && !receipt.isBlank()) {
                orderRequest.put("receipt", receipt);
            }
            if (description != null && !description.isBlank()) {
                orderRequest.put("notes", new JSONObject().put("description", description));
            }

            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            Order order = client.orders.create(orderRequest);

            log.info("Razorpay order created: id={}, amount={} {}", order.get("id"), amountPaise, currencyCode);
            return new RazorpayOrderResult(order.get("id").toString(), amountPaise, currencyCode, keyId);
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order", e);
            throw new IllegalStateException("Could not create payment order: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies that the signature returned by Razorpay Checkout matches the
     * one that should have been produced for the order/payment pair.
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        boolean valid = RazorpayPaymentVerifier.isValidSignature(keySecret, orderId, paymentId, signature);
        log.info("Razorpay signature verification result: orderId={}, paymentId={}, valid={}",
                orderId, paymentId, valid);
        return valid;
    }

    /**
     * Confirms the amount actually captured against the Razorpay order matches
     * the expected amount (in paise). Guards against under-charging or amount
     * tampering between order creation and payment verification.
     */
    public boolean isOrderAmountMatching(String orderId, long expectedPaise) {
        try {
            requireConfigured();
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            Order order = client.orders.fetch(orderId);
            Object amount = order.get("amount");
            boolean matches = amount != null && ((Number) amount).longValue() == expectedPaise;
            log.info("Razorpay order amount check: orderId={}, expected={}, actual={}, matches={}",
                    orderId, expectedPaise, amount, matches);
            return matches;
        } catch (RazorpayException e) {
            log.error("Failed to fetch Razorpay order amount for orderId={}", orderId, e);
            return false;
        }
    }

    private void requireConfigured() {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException(
                    "Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
        }
    }

    private long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }
}
