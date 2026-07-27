package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
}
