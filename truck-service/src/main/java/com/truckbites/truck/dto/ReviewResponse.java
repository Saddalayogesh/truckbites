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
@Schema(description = "Review details")
public class ReviewResponse {

    @Schema(description = "Unique review identifier", example = "1")
    private Long id;

    @Schema(description = "ID of the customer who wrote the review", example = "1")
    private Long customerId;

    @Schema(description = "ID of the truck being reviewed", example = "1")
    private Long truckId;

    @Schema(description = "ID of the completed order", example = "1")
    private Long orderId;

    @Schema(description = "Rating from 1 to 5", example = "4")
    private Integer rating;

    @Schema(description = "Optional review comment", example = "Great tacos! Highly recommend.")
    private String comment;

    @Schema(description = "Timestamp when the review was created", example = "2026-07-27T10:30:00")
    private LocalDateTime createdAt;
}
