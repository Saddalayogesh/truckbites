package com.truckbites.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

/**
 * Request body for updating a menu item's inventory quantity.
 */
@Data
@Schema(description = "Request body for updating menu item inventory")
public class UpdateInventoryRequest {

    @NotNull(message = "Quantity is required")
    @PositiveOrZero(message = "Quantity must be zero or positive")
    @Schema(description = "New inventory quantity (setting to 0 auto-flips isAvailable to false)", example = "25", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;
}
