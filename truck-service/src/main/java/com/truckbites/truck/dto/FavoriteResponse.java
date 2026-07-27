package com.truckbites.truck.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Favorite response with truck details")
public class FavoriteResponse {

    @Schema(description = "Unique favorite identifier", example = "1")
    private Long id;

    @Schema(description = "ID of the customer who favorited", example = "1")
    private Long customerId;

    @Schema(description = "ID of the favorited truck", example = "1")
    private Long truckId;

    @Schema(description = "Name of the favorited truck", example = "Taco Express")
    private String truckName;

    @Schema(description = "Cuisine type of the favorited truck", example = "Mexican")
    private String cuisineType;

    @Schema(description = "URL to truck image", example = "https://example.com/images/taco-express.jpg")
    private String imageUrl;

    @Schema(description = "Average rating of the truck", example = "4.5")
    private Double averageRating;

    @Schema(description = "Timestamp when the favorite was added", example = "2026-07-27T10:30:00")
    private LocalDateTime createdAt;
}
