package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request body for creating a Razorpay order")
public class CreateRazorpayOrderRequest {

    @Schema(description = "TruckBites order id (used in the receipt when no custom receipt is given)", example = "1")
    private Long orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Payment amount in INR", example = "499.00", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amount;

    @Schema(description = "Currency code (default: INR)", example = "INR")
    private String currency;

    @Schema(description = "Unique receipt reference shown on the Razorpay dashboard", example = "order_123")
    private String receipt;

    @Schema(description = "Human-readable description for the payment", example = "TruckBites order")
    private String description;

    @Schema(description = "Customer email for the payment receipt", example = "customer@example.com")
    @Email(message = "Customer email must be a valid email address")
    private String customerEmail;
}
