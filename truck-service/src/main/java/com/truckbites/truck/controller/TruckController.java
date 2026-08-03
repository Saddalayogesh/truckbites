package com.truckbites.truck.controller;

import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for food truck management.
 * Provides public search and detail endpoints, plus authenticated
 * endpoints for vendors to manage their own trucks.
 */
@Slf4j
@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
@Tag(name = "Trucks", description = "Food truck management endpoints")
public class TruckController {

    private final TruckService truckService;

    @GetMapping("/search")
    @Operation(
            summary = "Search for food trucks",
            description = "Search trucks by cuisine type, location, or both. " +
                    "When latitude, longitude, and radiusKm are provided, performs a " +
                    "geospatial search using bounding-box pre-filtering and Haversine distance calculation. " +
                    "When only cuisineType is provided, filters by cuisine. " +
                    "With no parameters, returns all trucks."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of matching trucks returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Truck.class))))
    })
    public ResponseEntity<List<Truck>> searchTrucks(
            @Parameter(description = "Filter by cuisine type (e.g., Mexican, Italian, BBQ)", example = "Mexican")
            @RequestParam(required = false) String cuisineType,
            @Parameter(description = "Latitude of the center point for location-based search", example = "40.7128")
            @RequestParam(required = false) Double latitude,
            @Parameter(description = "Longitude of the center point for location-based search", example = "-74.0060")
            @RequestParam(required = false) Double longitude,
            @Parameter(description = "Search radius in kilometers", example = "10.0")
            @RequestParam(required = false) Double radiusKm) {

        log.info("Search trucks: cuisineType={}, location=({},{}), radius={}km",
                cuisineType, latitude, longitude, radiusKm);
        return ResponseEntity.ok(
                truckService.searchTrucks(cuisineType, latitude, longitude, radiusKm));
    }

    @GetMapping("/trending")
    @Operation(
            summary = "Get trending food trucks",
            description = "Returns the top 6 food trucks ranked by average customer rating (descending)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of top 6 trending trucks returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Truck.class))))
    })
    public ResponseEntity<List<Truck>> getTrendingTrucks() {
        log.info("Get trending trucks");
        return ResponseEntity.ok(truckService.getTrendingTrucks());
    }

    @GetMapping("/my-trucks")
    @Operation(
            summary = "Get my trucks (VENDOR)",
            description = "Returns all trucks owned by the authenticated vendor. " +
                    "Requires VENDOR role.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of vendor's trucks returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Truck.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires VENDOR role")
    })
    public ResponseEntity<List<Truck>> getMyTrucks(Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Get my trucks for ownerId: {}", ownerId);
        return ResponseEntity.ok(truckService.getMyTrucks(ownerId));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get truck by ID",
            description = "Returns detailed information about a specific food truck by its unique identifier."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Truck details returned",
                    content = @Content(schema = @Schema(implementation = Truck.class))),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<Truck> getTruck(@Parameter(description = "Truck ID", example = "1") @PathVariable Long id) {
        log.info("Get truck by id: {}", id);
        return ResponseEntity.ok(truckService.getTruckById(id));
    }

    @PostMapping
    @Operation(
            summary = "Create a new truck (VENDOR)",
            description = "Creates a new food truck. Only users with VENDOR role can create trucks. " +
                    "The truck is created with CLOSED status by default.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Truck created successfully",
                    content = @Content(schema = @Schema(implementation = Truck.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed - invalid input"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Only VENDOR users can create trucks")
    })
    public ResponseEntity<Truck> createTruck(
            @Valid @RequestBody CreateTruckRequest request,
            Authentication authentication) {

        checkVendorRole(authentication);
        Long ownerId = extractUserId(authentication);
        log.info("Create truck: name='{}', ownerId={}", request.getName(), ownerId);
        Truck truck = truckService.createTruck(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(truck);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update an existing truck (VENDOR)",
            description = "Updates truck details. The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Truck updated successfully",
                    content = @Content(schema = @Schema(implementation = Truck.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed - invalid input"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<Truck> updateTruck(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody CreateTruckRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update truck: id={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(truckService.updateTruck(id, request, ownerId));
    }

    @PutMapping("/{id}/location")
    @Operation(
            summary = "Update truck location (VENDOR)",
            description = "Updates the GPS coordinates of a food truck. " +
                    "The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Location updated successfully",
                    content = @Content(schema = @Schema(implementation = Truck.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<Truck> updateLocation(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody UpdateLocationRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update location: truckId={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(truckService.updateLocation(id, request, ownerId));
    }

    /**
     * Returns all trucks (ADMIN only).
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all trucks (ADMIN)",
            description = "Returns all trucks in the system. Restricted to ADMIN users.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of all trucks returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Truck.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role")
    })
    public ResponseEntity<List<Truck>> getAllTrucksAdmin() {
        log.info("Get all trucks (admin)");
        return ResponseEntity.ok(truckService.getAllTrucks());
    }

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Toggle truck status (VENDOR)",
            description = "Toggles the truck's operational status between OPEN and CLOSED. " +
                    "The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Truck status toggled",
                    content = @Content(schema = @Schema(implementation = Truck.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<Truck> toggleStatus(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long id,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Toggle status: truckId={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(truckService.toggleStatus(id, ownerId));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a truck (VENDOR)",
            description = "Deletes a food truck and all its associated data. " +
                    "The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Truck deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<Void> deleteTruck(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long id,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Delete truck: id={}, ownerId={}", id, ownerId);
        truckService.deleteTruck(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Ensures the authenticated user has the VENDOR role.
     * Called only for truck creation (VENDOR-only operation).
     */
    private void checkVendorRole(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isVendor = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VENDOR"));
        if (!isVendor) {
            log.warn("Non-VENDOR user attempted to create a truck");
            throw new AccessDeniedException("Only VENDOR users can create trucks");
        }
    }

    /**
     * Extracts the user ID from the Authentication principal.
     * The principal is the email (username) set by JwtValidationFilter.
     * TODO: Extract userId from JWT custom claims once added to auth-service.
     */
    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String email) {
            log.debug("Authenticated user: {}", email);
        }
        return 0L; // Placeholder — replace with userId from JWT claim when available
    }
}
