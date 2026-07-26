package com.truckbites.order.dto;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Request body for placing a new order.
 */
@Data
@Schema(description = "Request body for placing a new order")
public class CreateOrderRequest {

    @NotNull(message = "Truck ID is required")
    @Schema(description = "ID of the food truck to order from", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long truckId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    @ArraySchema(minItems = 1, schema = @Schema(implementation = OrderItemRequest.class))
    @Schema(description = "List of menu items to order", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<OrderItemRequest> items;

    @Data
    @Schema(description = "An item to include in the order")
    public static class OrderItemRequest {

        @NotNull(message = "Menu item ID is required")
        @Schema(description = "ID of the menu item to order", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
        private Long menuItemId;

        @NotNull(message = "Quantity is required")
        @Schema(description = "Quantity of this item to order", example = "2", requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1")
        private Integer quantity;
    }
}
