package com.truckbites.order.dto;

import com.truckbites.order.model.OrderStatus;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response containing full order details including all order items.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Complete order details with items")
public class OrderResponse {

    @Schema(description = "Unique order identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "ID of the customer who placed the order", example = "1")
    private Long customerId;

    @Schema(description = "ID of the food truck fulfilling the order", example = "1")
    private Long truckId;

    @Schema(description = "Display name of the food truck fulfilling the order", example = "Biryani Wheels")
    private String truckName;

    @Schema(description = "Total order amount (subtotal - discount + platform fee + GST)", example = "7.98")
    private BigDecimal totalAmount;

    @Schema(description = "Food subtotal before fees and taxes", example = "7.50")
    private BigDecimal subtotalAmount;

    @Schema(description = "Member discount applied to the subtotal", example = "0.38")
    private BigDecimal discountAmount;

    @Schema(description = "Platform fee charged for this order", example = "5.00")
    private BigDecimal platformFee;

    @Schema(description = "GST payable on this order (5% food + 18% platform fee)", example = "1.27")
    private BigDecimal gstAmount;

    @Schema(description = "Platform commission on this order (based on vendor plan)", example = "0.60")
    private BigDecimal commissionAmount;

    @Schema(description = "Membership tier used for pricing", example = "GOLD",
            allowableValues = {"NONE", "SILVER", "GOLD", "PLATINUM"})
    private String membershipTier;

    @Schema(description = "Whether this order receives priority processing", example = "true")
    private Boolean priority;

    @Schema(description = "Special instructions for this order", example = "No onions, extra cheese")
    private String notes;

    @Schema(description = "Current order status", example = "PLACED",
            allowableValues = {"PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"})
    private OrderStatus status;

    @Schema(description = "Timestamp when the order was placed", example = "2026-07-26T14:30:00")
    private LocalDateTime createdAt;

    @ArraySchema(schema = @Schema(implementation = OrderItemResponse.class))
    @Schema(description = "Items included in this order")
    private List<OrderItemResponse> items;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @Schema(description = "An item within an order with snapshot details")
    public static class OrderItemResponse {

        @Schema(description = "Unique order item identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
        private Long id;

        @Schema(description = "ID of the menu item (snapshot at time of order)", example = "1")
        private Long menuItemId;

        @Schema(description = "Name of the menu item (snapshot at time of order)", example = "Street Taco")
        private String itemName;

        @Schema(description = "Price per unit (snapshot at time of order)", example = "3.99")
        private BigDecimal price;

        @Schema(description = "Quantity ordered", example = "2")
        private Integer quantity;
    }
}
