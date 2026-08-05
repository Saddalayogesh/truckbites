package com.truckbites.payment.controller;

import com.truckbites.payment.dto.CreatePaymentIntentRequest;
import com.truckbites.payment.dto.CreateRazorpayOrderRequest;
import com.truckbites.payment.dto.PaymentIntentResponse;
import com.truckbites.payment.dto.PaymentResponse;
import com.truckbites.payment.dto.RazorpayOrderResponse;
import com.truckbites.payment.dto.VerifyRazorpayPaymentRequest;
import com.truckbites.payment.service.PaymentService;
import com.truckbites.payment.service.StripePaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for payment processing.
 * Handles payment creation and retrieval.
 */
@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing endpoints")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripePaymentService stripePaymentService;

    /**
     * Create a Razorpay order for the given amount.
     * The returned order id is used by the frontend to open the Razorpay Checkout.
     */
    @PostMapping("/razorpay/order")
    @Operation(
            summary = "Create a Razorpay order",
            description = "Creates a Razorpay order for the given amount in INR. The returned razorpayOrderId " +
                    "is used by the frontend to initialise the Razorpay Checkout modal and the keyId " +
                    "identifies the merchant account.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Razorpay order created",
                    content = @Content(schema = @Schema(implementation = RazorpayOrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(
            @Valid @RequestBody CreateRazorpayOrderRequest request) {
        log.info("POST /api/payments/razorpay/order -> createRazorpayOrder for orderId={}", request.getOrderId());
        return ResponseEntity.ok(paymentService.createRazorpayOrder(request));
    }

    /**
     * Verify a Razorpay payment signature and record the payment.
     * Publishes an order.paid event to RabbitMQ when the signature is valid.
     */
    @PostMapping("/razorpay/verify")
    @Operation(
            summary = "Verify a Razorpay payment",
            description = "Verifies the Razorpay payment signature for the given order/payment pair. " +
                    "On a valid signature the payment is stored as SUCCESS and an order.paid event is " +
                    "published to RabbitMQ; otherwise it is stored as FAILED.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Payment verified and recorded",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(
            @Valid @RequestBody VerifyRazorpayPaymentRequest request) {
        log.info("POST /api/payments/razorpay/verify -> verifyRazorpayPayment for orderId={}", request.getOrderId());
        PaymentResponse response = paymentService.verifyAndRecordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create a Stripe PaymentIntent for an order.
     */
    @PostMapping("/create-intent")
    @Operation(
            summary = "Create Stripe PaymentIntent",
            description = "Creates a Stripe PaymentIntent for the given order and amount. " +
                    "Returns a client secret that the frontend uses to complete payment via Stripe.js. " +
                    "If Stripe is not configured, returns a mock client secret for testing.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PaymentIntent created",
                    content = @Content(schema = @Schema(implementation = PaymentIntentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request) {
        log.info("Create payment intent for orderId={}, amount={}", request.getOrderId(), request.getAmount());
        StripePaymentService.StripePaymentResult result = stripePaymentService.createPaymentIntent(
                request.getAmount(), request.getCurrency(), request.getOrderId());
        return ResponseEntity.ok(PaymentIntentResponse.builder()
                .clientSecret(result.clientSecret())
                .paymentIntentId(result.paymentIntentId())
                .status(result.status())
                .build());
    }

    /**
     * Get all payments for a specific order.
     */
    @GetMapping("/order/{orderId}")
    @Operation(
            summary = "Get payments by order ID",
            description = "Returns all payments associated with the given order, ordered by most recent first.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of payments returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PaymentResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<List<PaymentResponse>> getPaymentsByOrder(
            @Parameter(description = "Order ID", example = "1") @PathVariable Long orderId) {
        log.info("GET /api/payments/order/{} -> getPaymentsByOrder", orderId);
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }
}
