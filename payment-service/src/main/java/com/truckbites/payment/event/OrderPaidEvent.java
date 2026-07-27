package com.truckbites.payment.event;

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
public class OrderPaidEvent {

    private Long paymentId;
    private Long orderId;
    private BigDecimal amount;
    private String method;
    private String transactionRef;
    private String status;
    private LocalDateTime createdAt;
}
