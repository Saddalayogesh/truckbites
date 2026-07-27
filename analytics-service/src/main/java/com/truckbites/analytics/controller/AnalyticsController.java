package com.truckbites.analytics.controller;

import com.truckbites.analytics.dto.DailySalesResponse;
import com.truckbites.analytics.dto.OrderStatusSummaryResponse;
import com.truckbites.analytics.dto.TopSellingItemResponse;
import com.truckbites.analytics.service.AnalyticsService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for truck analytics.
 * All endpoints are VENDOR-only and validate truck ownership
 * via Feign call to truck-service before returning data.
 *
 * NOTE: This service has READ-ONLY access to order_db. It never creates,
 * updates, or deletes any data.
 */
@Slf4j
@RestController
@RequestMapping("/api/analytics/truck/{truckId}")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Read-only truck analytics endpoints (VENDOR only)")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/sales")
    @Operation(
            summary = "Get daily sales for a truck (VENDOR)",
            description = "Returns daily total sales for a specific truck, " +
                    "excluding CANCELLED orders. The authenticated vendor must own the truck."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Daily sales data returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = DailySalesResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found"),
            @ApiResponse(responseCode = "503", description = "Truck service unavailable")
    })
    public ResponseEntity<List<DailySalesResponse>> getDailySales(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        checkVendorRole(authentication);
        Long ownerId = extractUserId(authentication);
        log.info("GET daily sales for truckId={}, ownerId={}", truckId, ownerId);
        return ResponseEntity.ok(analyticsService.getDailySales(truckId, ownerId));
    }

    @GetMapping("/top-items")
    @Operation(
            summary = "Get top-selling items for a truck (VENDOR)",
            description = "Returns the top 10 best-selling menu items for a specific truck, " +
                    "ordered by quantity sold descending. The authenticated vendor must own the truck."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Top-selling items returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TopSellingItemResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found"),
            @ApiResponse(responseCode = "503", description = "Truck service unavailable")
    })
    public ResponseEntity<List<TopSellingItemResponse>> getTopSellingItems(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        checkVendorRole(authentication);
        Long ownerId = extractUserId(authentication);
        log.info("GET top selling items for truckId={}, ownerId={}", truckId, ownerId);
        return ResponseEntity.ok(analyticsService.getTopSellingItems(truckId, ownerId));
    }

    @GetMapping("/order-summary")
    @Operation(
            summary = "Get order count by status for a truck (VENDOR)",
            description = "Returns order counts grouped by status for a specific truck. " +
                    "The authenticated vendor must own the truck."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order status summary returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderStatusSummaryResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found"),
            @ApiResponse(responseCode = "503", description = "Truck service unavailable")
    })
    public ResponseEntity<List<OrderStatusSummaryResponse>> getOrderStatusSummary(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId,
            Authentication authentication) {
        checkVendorRole(authentication);
        Long ownerId = extractUserId(authentication);
        log.info("GET order summary for truckId={}, ownerId={}", truckId, ownerId);
        return ResponseEntity.ok(analyticsService.getOrderCountByStatus(truckId, ownerId));
    }

    /**
     * Ensures the authenticated user has the VENDOR role.
     */
    private void checkVendorRole(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isVendor = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VENDOR"));
        if (!isVendor) {
            log.warn("Non-VENDOR user attempted to access analytics");
            throw new AccessDeniedException("Only VENDOR users can access analytics");
        }
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
