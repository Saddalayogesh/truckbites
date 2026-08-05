package com.truckbites.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Response from creating a Razorpay order")
public class RazorpayOrderResponse {

    @Schema(description = "TruckBites order id the payment belongs to", example = "1")
    private Long orderId;

    @Schema(description = "Razorpay order id used to initialise Razorpay Checkout", example = "order_Nh4bXzq8")
    private String razorpayOrderId;

    @Schema(description = "Payment amount in INR", example = "499.00")
    private BigDecimal amount;

    @Schema(description = "Currency code", example = "INR")
    private String currency;

    @Schema(description = "Razorpay key id the frontend needs to initialise Razorpay Checkout", example = "rzp_test_xxx")
    private String keyId;
}
