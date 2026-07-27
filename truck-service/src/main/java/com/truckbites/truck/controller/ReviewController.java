package com.truckbites.truck.controller;

import com.truckbites.truck.dto.ReviewRequest;
import com.truckbites.truck.dto.ReviewResponse;
import com.truckbites.truck.model.Review;
import com.truckbites.truck.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Food truck review endpoints")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/truck/{truckId}")
    @Operation(
            summary = "Add a review for a completed order",
            description = "Adds a review for a completed order. Validates that the order exists, " +
                    "is in COMPLETED status, belongs to the specified truck, and hasn't been reviewed yet. " +
                    "Updates the truck's cached average rating after submission.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Review added successfully",
                    content = @Content(schema = @Schema(implementation = ReviewResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or order not COMPLETED"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "Truck or order not found"),
            @ApiResponse(responseCode = "409", description = "Order has already been reviewed"),
            @ApiResponse(responseCode = "503", description = "Order service unavailable")
    })
    public ResponseEntity<ReviewResponse> addReview(
            @Parameter(description = "Truck ID being reviewed", example = "1") @PathVariable Long truckId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Add review: customerId={}, truckId={}, orderId={}, rating={}",
                customerId, truckId, request.getOrderId(), request.getRating());

        Review review = reviewService.addReview(
                customerId, truckId, request.getOrderId(), request.getRating(), request.getComment());

        return ResponseEntity.status(HttpStatus.CREATED).body(toReviewResponse(review));
    }

    @GetMapping("/truck/{truckId}")
    @Operation(
            summary = "Get reviews for a truck",
            description = "Returns all reviews for a specific food truck, ordered by most recent first. " +
                    "This endpoint is public (no authentication required)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of reviews returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReviewResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<List<ReviewResponse>> getReviewsByTruck(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId) {
        log.info("Get reviews for truckId: {}", truckId);

        List<Review> reviews = reviewService.getReviewsByTruck(truckId);
        List<ReviewResponse> responses = reviews.stream()
                .map(this::toReviewResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    private ReviewResponse toReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .customerId(review.getCustomerId())
                .truckId(review.getTruckId())
                .orderId(review.getOrderId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    /**
     * Extracts the user ID from the Authentication principal.
     */
    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String email) {
            log.debug("Authenticated user: {}", email);
        }
        return 0L; // Placeholder — replace with userId from JWT claim when available
    }
}
