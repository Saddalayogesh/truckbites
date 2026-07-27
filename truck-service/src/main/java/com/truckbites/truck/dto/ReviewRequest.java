package com.truckbites.truck.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Request body for adding a review")
public class ReviewRequest {

    @NotNull(message = "Order ID is required")
    @Schema(description = "ID of the completed order being reviewed", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    @Schema(description = "Rating from 1 to 5", example = "4", requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1", maximum = "5")
    private Integer rating;

    @Schema(description = "Optional review comment", example = "Great tacos! Highly recommend.")
    private String comment;
}
