package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request body for processing a payment")
public class PaymentRequest {

    @NotNull(message = "Order ID is required")
    @Schema(description = "ID of the order being paid for", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Payment amount", example = "19.99", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    @Schema(description = "Payment method (e.g., CARD, CASH, UPI)", example = "CARD", requiredMode = Schema.RequiredMode.REQUIRED)
    private String method;

    @Schema(description = "Customer email for payment receipt notifications", example = "customer@example.com")
    @Email(message = "Customer email must be a valid email address")
    private String customerEmail;

    @Schema(description = "UPI transaction reference (UTR) from the customer's UPI app. " +
            "Used to verify the payment was actually completed — required for the mock gateway to succeed.",
            example = "123456789012")
    private String transactionRef;
}
