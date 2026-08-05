package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request body for verifying a Razorpay payment")
public class VerifyRazorpayPaymentRequest {

    @NotNull(message = "Order ID is required")
    @Schema(description = "ID of the order being paid for", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Payment amount in INR", example = "499.00", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amount;

    @Schema(description = "Payment method (defaults to RAZORPAY)", example = "RAZORPAY")
    private String method;

    @Schema(description = "Customer email for payment receipt notifications", example = "customer@example.com")
    @Email(message = "Customer email must be a valid email address")
    private String customerEmail;

    @NotBlank(message = "Razorpay order ID is required")
    @Schema(description = "Razorpay order id returned by create-order", example = "order_Nh4bXzq8", requiredMode = Schema.RequiredMode.REQUIRED)
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay payment ID is required")
    @Schema(description = "Razorpay payment id returned by the Checkout handler", example = "pay_Nh4bXzq8", requiredMode = Schema.RequiredMode.REQUIRED)
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay signature is required")
    @Schema(description = "Razorpay signature returned by the Checkout handler", example = "0d2f3a...", requiredMode = Schema.RequiredMode.REQUIRED)
    private String razorpaySignature;
}
