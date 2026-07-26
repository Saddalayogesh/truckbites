package com.truckbites.menu.controller;

import com.truckbites.menu.dto.CreateMenuItemRequest;
import com.truckbites.menu.dto.UpdateInventoryRequest;
import com.truckbites.menu.model.MenuItem;
import com.truckbites.menu.service.MenuService;
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

@Slf4j
@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    /**
     * Public endpoint: returns available menu items for a truck.
     */
    @GetMapping("/truck/{truckId}")
    public ResponseEntity<List<MenuItem>> getMenuByTruck(@PathVariable Long truckId) {
        log.info("Get available menu for truckId: {}", truckId);
        return ResponseEntity.ok(menuService.getMenuItemsByTruck(truckId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable Long id) {
        log.info("Get menu item by id: {}", id);
        return ResponseEntity.ok(menuService.getMenuItemById(id));
    }

    /**
     * Creates a menu item after verifying truck existence and ownership.
     */
    @PostMapping
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
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable Long id,
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
    public ResponseEntity<MenuItem> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update inventory: itemId={}, quantity={}, ownerId={}",
                id, request.getQuantity(), ownerId);
        return ResponseEntity.ok(menuService.updateInventory(id, request, ownerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable Long id,
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
