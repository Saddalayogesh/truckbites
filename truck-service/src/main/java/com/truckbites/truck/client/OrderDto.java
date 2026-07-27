package com.truckbites.truck.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Minimal DTO for the subset of OrderResponse fields needed
 * to validate reviews (order exists, is COMPLETED, belongs to truck).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {

    private Long id;
    private Long truckId;
    private String status;
    private LocalDateTime createdAt;
}
