package com.truckbites.truck.dto;

import com.truckbites.truck.model.TruckStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Detailed response containing all food truck information.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Detailed food truck information")
public class TruckResponse {

    @Schema(description = "Unique truck identifier", example = "1")
    private Long id;

    @Schema(description = "Name of the food truck", example = "Taco Express")
    private String name;

    @Schema(description = "Type of cuisine", example = "Mexican")
    private String cuisineType;

    @Schema(description = "Description of the truck", example = "Authentic Mexican street tacos with fresh ingredients")
    private String description;

    @Schema(description = "GPS latitude", example = "40.7128")
    private Double latitude;

    @Schema(description = "GPS longitude", example = "-74.0060")
    private Double longitude;

    @Schema(description = "Current operational status", example = "OPEN", allowableValues = {"OPEN", "CLOSED"})
    private TruckStatus status;

    @Schema(description = "User ID of the truck owner", example = "1")
    private Long ownerId;

    @Schema(description = "URL to truck image", example = "https://example.com/images/taco-express.jpg")
    private String imageUrl;

    @Schema(description = "Average rating based on customer reviews", example = "4.5")
    private Double averageRating;

    @Schema(description = "Timestamp when the truck was created", example = "2026-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the truck was last updated", example = "2026-07-26T14:00:00")
    private LocalDateTime updatedAt;
}
