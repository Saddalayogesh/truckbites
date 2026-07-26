package com.truckbites.truck.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for creating or updating a food truck.
 */
@Data
@Schema(description = "Request body for creating or updating a food truck")
public class CreateTruckRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Name of the food truck", example = "Taco Express", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "Cuisine type is required")
    @Schema(description = "Type of cuisine the truck serves", example = "Mexican", requiredMode = Schema.RequiredMode.REQUIRED)
    private String cuisineType;

    @Schema(description = "Description of the food truck and its offerings", example = "Authentic Mexican street tacos with fresh ingredients")
    private String description;

    @NotNull(message = "Latitude is required")
    @Schema(description = "GPS latitude of the truck's current location", example = "40.7128", requiredMode = Schema.RequiredMode.REQUIRED)
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @Schema(description = "GPS longitude of the truck's current location", example = "-74.0060", requiredMode = Schema.RequiredMode.REQUIRED)
    private Double longitude;

    @Schema(description = "URL to the truck's profile image", example = "https://example.com/images/taco-express.jpg")
    private String imageUrl;
}
