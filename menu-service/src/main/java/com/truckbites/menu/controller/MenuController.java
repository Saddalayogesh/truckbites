package com.truckbites.menu.controller;

import com.truckbites.menu.dto.CreateMenuItemRequest;
import com.truckbites.menu.dto.UpdateInventoryRequest;
import com.truckbites.menu.model.MenuItem;
import com.truckbites.menu.service.MenuService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for menu item management.
 * Provides public menu browsing endpoints and authenticated
 * endpoints for vendors to manage their menu items and inventory.
 */
@Slf4j
@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@Tag(name = "Menu Items", description = "Menu and inventory management endpoints for food trucks")
public class MenuController {

    private final MenuService menuService;

    /**
     * Public endpoint: returns available menu items for a truck.
     */
    @GetMapping("/truck/{truckId}")
    @Operation(
            summary = "Get available menu items for a truck",
            description = "Returns all currently available menu items for a specific food truck. " +
                    "This is a public endpoint that does not require authentication."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of available menu items returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MenuItem.class)))),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<List<MenuItem>> getMenuByTruck(
            @Parameter(description = "ID of the food truck", example = "1") @PathVariable Long truckId) {
        log.info("Get available menu for truckId: {}", truckId);
        return ResponseEntity.ok(menuService.getMenuItemsByTruck(truckId));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get a single menu item by ID",
            description = "Returns details for a specific menu item."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Menu item details returned",
                    content = @Content(schema = @Schema(implementation = MenuItem.class))),
            @ApiResponse(responseCode = "404", description = "Menu item not found")
    })
    public ResponseEntity<MenuItem> getMenuItem(
            @Parameter(description = "Menu item ID", example = "1") @PathVariable Long id) {
        log.info("Get menu item by id: {}", id);
        return ResponseEntity.ok(menuService.getMenuItemById(id));
    }

    /**
     * Creates a menu item after verifying truck existence and ownership.
     */
    @PostMapping
    @Operation(
            summary = "Create a new menu item (VENDOR)",
            description = "Adds a new menu item to a food truck. The authenticated vendor must own the truck. " +
                    "If quantityAvailable is set to 0, the item is marked as unavailable.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Menu item created successfully",
                    content = @Content(schema = @Schema(implementation = MenuItem.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<MenuItem> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Create menu item: name='{}', truckId={}, ownerId={}",
                request.getName(), request.getTruckId(), ownerId);
        MenuItem menuItem = menuService.addMenuItem(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItem);
    }

    /**
     * Updates a menu item after verifying truck existence and ownership.
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "Update a menu item (VENDOR)",
            description = "Updates the details of an existing menu item. The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Menu item updated successfully",
                    content = @Content(schema = @Schema(implementation = MenuItem.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Menu item not found")
    })
    public ResponseEntity<MenuItem> updateMenuItem(
            @Parameter(description = "Menu item ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody CreateMenuItemRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update menu item: id={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(menuService.updateMenuItem(id, request, ownerId));
    }

    /**
     * Updates inventory with auto-flip — quantity 0 marks item unavailable.
     */
    @PatchMapping("/{id}/inventory")
    @Operation(
            summary = "Update menu item inventory (VENDOR)",
            description = "Updates the inventory quantity for a menu item. " +
                    "Setting quantity to 0 automatically marks the item as unavailable. " +
                    "The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inventory updated successfully",
                    content = @Content(schema = @Schema(implementation = MenuItem.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Menu item not found")
    })
    public ResponseEntity<MenuItem> updateInventory(
            @Parameter(description = "Menu item ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update inventory: itemId={}, quantity={}, ownerId={}",
                id, request.getQuantity(), ownerId);
        return ResponseEntity.ok(menuService.updateInventory(id, request, ownerId));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a menu item (VENDOR)",
            description = "Deletes a menu item. The authenticated vendor must own the truck.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Menu item deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Menu item not found")
    })
    public ResponseEntity<Void> deleteMenuItem(
            @Parameter(description = "Menu item ID", example = "1") @PathVariable Long id,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Delete menu item: id={}, ownerId={}", id, ownerId);
        menuService.deleteMenuItem(id, ownerId);
        return ResponseEntity.noContent().build();
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
