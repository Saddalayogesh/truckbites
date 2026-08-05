package com.truckbites.menu.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.menu.client.TruckDto;
import com.truckbites.menu.client.TruckServiceClient;
import com.truckbites.menu.dto.CreateMenuItemRequest;
import com.truckbites.menu.dto.UpdateInventoryRequest;
import com.truckbites.menu.model.MenuItem;
import com.truckbites.menu.repository.MenuItemRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final TruckServiceClient truckServiceClient;

    /**
     * Validates that the truck exists and is owned by the given ownerId.
     */
    private TruckDto validateTruckOwnership(Long truckId, Long ownerId) {
        TruckDto truck;
        try {
            truck = truckServiceClient.getTruckById(truckId);
        } catch (FeignException.NotFound e) {
            log.warn("Truck not found with id: {}", truckId);
            throw new ResourceNotFoundException("Truck not found with id: " + truckId);
        } catch (FeignException e) {
            log.error("Failed to call truck-service for truckId: {}", truckId, e);
            throw e; // Let GlobalExceptionHandler translate to 503
        }

        if (!truck.getOwnerId().equals(ownerId)) {
            log.warn("User {} does not own truck {}", ownerId, truckId);
            throw new UnauthorizedException("You do not own this truck");
        }

        log.debug("Truck {} validated for ownerId {}", truckId, ownerId);
        return truck;
    }

    @Transactional
    public MenuItem addMenuItem(CreateMenuItemRequest request, Long ownerId) {
        log.info("Creating menu item '{}' for truckId: {}", request.getName(), request.getTruckId());

        // Verify truck exists and caller owns it
        validateTruckOwnership(request.getTruckId(), ownerId);

        int quantity = request.getQuantityAvailable() != null ? request.getQuantityAvailable() : 0;
        boolean available = quantity > 0
                ? (request.getIsAvailable() != null ? request.getIsAvailable() : true)
                : false;

        MenuItem menuItem = MenuItem.builder()
                .truckId(request.getTruckId())
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .quantityAvailable(quantity)
                .isAvailable(available)
                .imageUrl(request.getImageUrl())
                .build();

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Menu item created with id: {} for truckId: {}", saved.getId(), request.getTruckId());
        return saved;
    }

    public MenuItem getMenuItemById(Long id) {
        log.debug("Fetching menu item by id: {}", id);
        return menuItemRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Menu item not found with id: {}", id);
                    return new ResourceNotFoundException("Menu item not found with id: " + id);
                });
    }

    /**
     * Returns only available menu items for public consumption.
     */
    public List<MenuItem> getMenuItemsByTruck(Long truckId) {
        log.debug("Fetching available menu items for truckId: {}", truckId);
        return menuItemRepository.findByTruckIdAndIsAvailableTrue(truckId);
    }

    @Transactional
    public MenuItem updateMenuItem(Long id, CreateMenuItemRequest request, Long ownerId) {
        log.debug("Updating menu item id: {}", id);

        // Verify truck exists and caller owns it
        validateTruckOwnership(request.getTruckId(), ownerId);

        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Menu item not found with id: {}", id);
                    return new ResourceNotFoundException("Menu item not found with id: " + id);
                });

        int quantity = request.getQuantityAvailable() != null ? request.getQuantityAvailable() : menuItem.getQuantityAvailable();
        boolean available = quantity > 0
                ? (request.getIsAvailable() != null ? request.getIsAvailable() : menuItem.getIsAvailable())
                : false;

        menuItem.setTruckId(request.getTruckId());
        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        menuItem.setCategory(request.getCategory());
        menuItem.setQuantityAvailable(quantity);
        menuItem.setIsAvailable(available);
        menuItem.setImageUrl(request.getImageUrl());

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Menu item updated: id={}", id);
        return saved;
    }

    /**
     * Updates inventory and auto-flips isAvailable to false when quantity reaches 0.
     */
    @Transactional
    public MenuItem updateInventory(Long id, UpdateInventoryRequest request, Long ownerId) {
        log.debug("Updating inventory for menu item id: {} to {}", id, request.getQuantity());

        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Menu item not found with id: {}", id);
                    return new ResourceNotFoundException("Menu item not found with id: " + id);
                });

        // Verify caller owns the truck this menu item belongs to
        validateTruckOwnership(menuItem.getTruckId(), ownerId);

        menuItem.setQuantityAvailable(request.getQuantity());

        // Auto-flip: when quantity hits 0, mark as unavailable
        if (request.getQuantity() == 0) {
            menuItem.setIsAvailable(false);
            log.debug("Auto-flipping isAvailable to false for menu item id: {} (quantity 0)", id);
        }

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Menu item inventory updated: id={}, quantity={}, isAvailable={}",
                id, saved.getQuantityAvailable(), saved.getIsAvailable());
        return saved;
    }

    @Transactional
    public void deleteMenuItem(Long id, Long ownerId) {
        log.debug("Deleting menu item id: {}", id);

        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Menu item not found with id: {}", id);
                    return new ResourceNotFoundException("Menu item not found with id: " + id);
                });

        // Verify caller owns the truck this menu item belongs to
        validateTruckOwnership(menuItem.getTruckId(), ownerId);

        menuItemRepository.delete(menuItem);
        log.info("Menu item deleted: id={}", id);
    }

    public List<MenuItem> searchMenuItems(String query) {
        log.debug("Searching menu items with query: {}", query);
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return menuItemRepository.findByNameContainingIgnoreCase(query.trim());
    }
}
