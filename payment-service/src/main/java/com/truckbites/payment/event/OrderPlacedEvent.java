package com.truckbites.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Event received when an order is placed.
 * Matches the structure published by order-service.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderPlacedEvent {

    private Long orderId;
    private Long customerId;
    private Long truckId;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemEvent> items;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemEvent {
        private Long menuItemId;
        private String itemName;
        private BigDecimal price;
        private Integer quantity;
    }
}
