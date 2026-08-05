package com.truckbites.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request body for creating or updating a menu item.
 */
@Data
@Schema(description = "Request body for creating or updating a menu item")
public class CreateMenuItemRequest {

    @NotNull(message = "Truck ID is required")
    @Schema(description = "ID of the truck this menu item belongs to", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long truckId;

    @NotBlank(message = "Name is required")
    @Schema(description = "Name of the menu item", example = "Street Taco", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Description of the menu item", example = "Soft corn tortilla with grilled chicken, cilantro, and onions")
    private String description;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be zero or positive")
    @Schema(description = "Price of the item", example = "3.99", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal price;

    @NotBlank(message = "Category is required")
    @Schema(description = "Item category for menu organization", example = "Tacos", requiredMode = Schema.RequiredMode.REQUIRED)
    private String category;

    @PositiveOrZero(message = "Quantity must be zero or positive")
    @Schema(description = "Available inventory quantity", example = "50", defaultValue = "0")
    private Integer quantityAvailable;

    @Schema(description = "Whether the item is currently available for ordering", example = "true", defaultValue = "true")
    private Boolean isAvailable;

    @Schema(description = "URL to the item's image", example = "https://example.com/images/street-taco.jpg")
    private String imageUrl;
}
