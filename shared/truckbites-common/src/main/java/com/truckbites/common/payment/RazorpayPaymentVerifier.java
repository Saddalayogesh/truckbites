package com.truckbites.common.payment;

import com.truckbites.common.exception.BadRequestException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;

/**
 * Shared Razorpay payment-verification helpers used by the microservices that
 * accept payments (orders, plan subscriptions, truck promotions).
 * <p>
 * Razorpay signs every successful payment with
 * {@code hex(HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret))}.
 * The signature is generated in the customer's browser by Razorpay Checkout and
 * returned to the frontend, which forwards it to the backend for verification.
 * Only payments whose signature can be verified against the configured
 * {@code razorpay.key-secret} are accepted.
 */
public final class RazorpayPaymentVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final char[] HEX_CHARS = "0123456789abcdef".toCharArray();

    public static final String VERIFICATION_MESSAGE =
            "Payment could not be verified. Please retry the payment.";

    private RazorpayPaymentVerifier() {
    }

    /**
     * Computes the Razorpay payment signature for the given order/payment pair.
     * Exposed for testing and tooling; the browser never needs this.
     */
    public static String sign(String keySecret, String orderId, String paymentId) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(
                    keySecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(
                    (orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(HEX_CHARS[(b >> 4) & 0xF]).append(HEX_CHARS[b & 0xF]);
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Razorpay signature verification unavailable", e);
        }
    }

    /**
     * Returns {@code true} when the supplied signature matches the signature
     * Razorpay would have generated for the given order/payment pair.
     */
    public static boolean isValidSignature(String keySecret, String orderId, String paymentId, String signature) {
        if (keySecret == null || keySecret.isBlank()
                || orderId == null || orderId.isBlank()
                || paymentId == null || paymentId.isBlank()
                || signature == null || signature.isBlank()) {
            return false;
        }
        String expected = sign(keySecret, orderId, paymentId);
        // Constant-time comparison to avoid leaking timing information.
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Verifies the supplied Razorpay payment signature, throwing
     * {@link BadRequestException} (HTTP 400) when the payment cannot be verified.
     */
    public static void requireValidSignature(String keySecret, String orderId, String paymentId, String signature) {
        if (!isValidSignature(keySecret, orderId, paymentId, signature)) {
            throw new BadRequestException(VERIFICATION_MESSAGE);
        }
    }
}
