package com.truckbites.truck.controller;

import com.truckbites.truck.dto.FavoriteResponse;
import com.truckbites.truck.model.Favorite;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.service.FavoriteService;
import com.truckbites.truck.service.TruckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "Favorite food truck management endpoints")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final TruckService truckService;

    @PostMapping("/{truckId}")
    @Operation(
            summary = "Add a truck to favorites",
            description = "Adds a food truck to the authenticated customer's favorites list.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Truck added to favorites",
                    content = @Content(schema = @Schema(implementation = FavoriteResponse.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<FavoriteResponse> addFavorite(
            @Parameter(description = "Truck ID to favorite", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Add favorite: customerId={}, truckId={}", customerId, truckId);
        Favorite favorite = favoriteService.addFavorite(customerId, truckId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toFavoriteResponse(favorite));
    }

    @DeleteMapping("/{truckId}")
    @Operation(
            summary = "Remove a truck from favorites",
            description = "Removes a food truck from the authenticated customer's favorites list.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Truck removed from favorites"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "Favorite not found")
    })
    public ResponseEntity<Void> removeFavorite(
            @Parameter(description = "Truck ID to unfavorite", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Remove favorite: customerId={}, truckId={}", customerId, truckId);
        favoriteService.removeFavorite(customerId, truckId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(
            summary = "Get my favorites",
            description = "Returns all favorite trucks for the authenticated customer, with truck details.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of favorite trucks returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FavoriteResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<List<FavoriteResponse>> getMyFavorites(Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Get my favorites for customerId: {}", customerId);
        List<Favorite> favorites = favoriteService.getMyFavorites(customerId);
        List<FavoriteResponse> responses = favorites.stream()
                .map(this::toFavoriteResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{truckId}/check")
    @Operation(
            summary = "Check if truck is favorited",
            description = "Returns whether a specific truck is in the authenticated customer's favorites.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Favorite status returned"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<Boolean> checkFavorite(
            @Parameter(description = "Truck ID to check", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        boolean isFavorited = favoriteService.isFavorited(customerId, truckId);
        return ResponseEntity.ok(isFavorited);
    }

    /**
     * Builds a FavoriteResponse with truck details populated.
     */
    private FavoriteResponse toFavoriteResponse(Favorite favorite) {
        Truck truck = truckService.getTruckById(favorite.getTruckId());
        return FavoriteResponse.builder()
                .id(favorite.getId())
                .customerId(favorite.getCustomerId())
                .truckId(favorite.getTruckId())
                .truckName(truck.getName())
                .cuisineType(truck.getCuisineType())
                .imageUrl(truck.getImageUrl())
                .averageRating(truck.getAverageRating())
                .createdAt(favorite.getCreatedAt())
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
