package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request body for creating a Stripe payment intent")
public class CreatePaymentIntentRequest {

    @NotNull(message = "Order ID is required")
    @Schema(description = "ID of the order being paid for", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Payment amount", example = "19.99", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amount;

    @Schema(description = "Currency code (default: usd)", example = "usd")
    private String currency;
}
