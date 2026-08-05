package com.truckbites.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response containing full menu item details.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Detailed menu item information")
public class MenuItemResponse {

    @Schema(description = "Unique menu item identifier", example = "1")
    private Long id;

    @Schema(description = "ID of the truck this item belongs to", example = "1")
    private Long truckId;

    @Schema(description = "Name of the menu item", example = "Street Taco")
    private String name;

    @Schema(description = "Description of the item", example = "Soft corn tortilla with grilled chicken, cilantro, and onions")
    private String description;

    @Schema(description = "Price of the item", example = "3.99")
    private BigDecimal price;

    @Schema(description = "Item category", example = "Tacos")
    private String category;

    @Schema(description = "Current inventory quantity", example = "50")
    private Integer quantityAvailable;

    @Schema(description = "Whether the item is available for ordering", example = "true")
    private Boolean isAvailable;

    @Schema(description = "URL to item image", example = "https://example.com/images/street-taco.jpg")
    private String imageUrl;

    @Schema(description = "Timestamp when the item was created", example = "2026-01-15T10:30:00")
    private LocalDateTime createdAt;
}
