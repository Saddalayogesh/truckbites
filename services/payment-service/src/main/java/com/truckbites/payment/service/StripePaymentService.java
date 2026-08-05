package com.truckbites.payment.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class StripePaymentService {

    @Value("${stripe.secret.key:}")
    private String secretKey;

    /**
     * Creates a Stripe PaymentIntent for the given amount.
     * Returns the client secret that the frontend uses to complete payment.
     */
    public StripePaymentResult createPaymentIntent(BigDecimal amount, String currency, Long orderId) {
        // If Stripe is not configured, return a mock result
        if (secretKey == null || secretKey.isBlank()) {
            log.warn("Stripe not configured, returning mock payment intent for order {}", orderId);
            return new StripePaymentResult(
                    "mock_client_secret_" + orderId,
                    "mock_pi_" + orderId,
                    "requires_payment_method"
            );
        }

        try {
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency != null ? currency.toLowerCase() : "usd")
                    .putMetadata("order_id", String.valueOf(orderId))
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            log.info("Stripe PaymentIntent created: id={}, amount={} {}",
                    intent.getId(), amountInCents, currency);

            return new StripePaymentResult(
                    intent.getClientSecret(),
                    intent.getId(),
                    intent.getStatus()
            );
        } catch (StripeException e) {
            log.error("Failed to create Stripe PaymentIntent for order {}", orderId, e);
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }
    }

    public record StripePaymentResult(String clientSecret, String paymentIntentId, String status) {}
}
