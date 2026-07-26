package com.truckbites.menu.controller;

import com.truckbites.auth.entity.User;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.menu.dto.MenuItemDto;
import com.truckbites.menu.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;
    private final UserRepository userRepository;

    public MenuController(MenuService menuService, UserRepository userRepository) {
        this.menuService = menuService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<MenuItemDto> addMenuItem(@Valid @RequestBody MenuItemDto dto) {
        Long ownerId = getCurrentUserId();
        MenuItemDto created = menuService.addMenuItem(dto, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<MenuItemDto> updateMenuItem(@PathVariable Long id,
                                                       @Valid @RequestBody MenuItemDto dto) {
        Long ownerId = getCurrentUserId();
        MenuItemDto updated = menuService.updateMenuItem(id, dto, ownerId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/inventory")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<MenuItemDto> updateInventory(@PathVariable Long id,
                                                        @RequestBody Map<String, Integer> body) {
        Long ownerId = getCurrentUserId();
        Integer newQuantity = body.get("quantityAvailable");
        if (newQuantity == null) {
            throw new IllegalArgumentException("quantityAvailable is required");
        }
        MenuItemDto updated = menuService.updateInventory(id, newQuantity, ownerId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        Long ownerId = getCurrentUserId();
        menuService.deleteMenuItem(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/truck/{truckId}")
    public ResponseEntity<List<MenuItemDto>> getMenuByTruckId(@PathVariable Long truckId) {
        List<MenuItemDto> items = menuService.getMenuByTruckId(truckId);
        return ResponseEntity.ok(items);
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
        return user.getId();
    }
}
