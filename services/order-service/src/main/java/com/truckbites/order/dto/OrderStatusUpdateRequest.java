package com.truckbites.order.dto;

import com.truckbites.order.model.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for updating the status of an existing order.
 */
@Data
@Schema(description = "Request body for updating order status")
public class OrderStatusUpdateRequest {

    @NotNull(message = "Status is required")
    @Schema(description = "New status for the order", example = "PREPARING",
            allowableValues = {"PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"},
            requiredMode = Schema.RequiredMode.REQUIRED)
    private OrderStatus status;
}
