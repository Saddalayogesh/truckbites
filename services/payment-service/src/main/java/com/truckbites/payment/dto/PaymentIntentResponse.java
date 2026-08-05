package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Response from creating a payment intent")
public class PaymentIntentResponse {

    @Schema(description = "Client secret for completing payment on frontend", example = "pi_..._secret_...")
    private String clientSecret;

    @Schema(description = "Stripe PaymentIntent ID", example = "pi_1234567890")
    private String paymentIntentId;

    @Schema(description = "Status of the payment intent", example = "requires_payment_method")
    private String status;
}
