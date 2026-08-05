package com.truckbites.payment.dto;

import com.truckbites.payment.model.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Payment details response")
public class PaymentResponse {

    @Schema(description = "Unique payment identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "ID of the order being paid for", example = "1")
    private Long orderId;

    @Schema(description = "Payment amount", example = "19.99")
    private BigDecimal amount;

    @Schema(description = "Payment status", example = "SUCCESS", allowableValues = {"PENDING", "SUCCESS", "FAILED"})
    private PaymentStatus status;

    @Schema(description = "Payment method", example = "CARD")
    private String method;

    @Schema(description = "Transaction reference from the gateway", example = "TXN-A1B2C3D4E5F6G7H8")
    private String transactionRef;

    @Schema(description = "Timestamp when the payment was processed", example = "2026-07-26T14:30:00")
    private LocalDateTime createdAt;
}
