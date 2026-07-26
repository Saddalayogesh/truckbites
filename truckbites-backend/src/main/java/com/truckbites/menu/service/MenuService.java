package com.truckbites.menu.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.menu.dto.MenuItemDto;
import com.truckbites.menu.entity.MenuItem;
import com.truckbites.menu.repository.MenuItemRepository;
import com.truckbites.truck.entity.Truck;
import com.truckbites.truck.repository.TruckRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final TruckRepository truckRepository;

    public MenuService(MenuItemRepository menuItemRepository, TruckRepository truckRepository) {
        this.menuItemRepository = menuItemRepository;
        this.truckRepository = truckRepository;
    }

    public MenuItemDto addMenuItem(MenuItemDto dto, Long ownerId) {
        Truck truck = truckRepository.findById(dto.getTruckId())
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", dto.getTruckId()));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        MenuItem item = MenuItem.builder()
                .truckId(dto.getTruckId())
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .category(dto.getCategory())
                .quantityAvailable(dto.getQuantityAvailable())
                .isAvailable(dto.getQuantityAvailable() != null && dto.getQuantityAvailable() > 0)
                .imageUrl(dto.getImageUrl())
                .build();

        return MenuItemDto.fromEntity(menuItemRepository.save(item));
    }

    public MenuItemDto updateMenuItem(Long id, MenuItemDto dto, Long ownerId) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));

        Truck truck = truckRepository.findById(item.getTruckId())
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", item.getTruckId()));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        if (dto.getName() != null) {
            item.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            item.setDescription(dto.getDescription());
        }
        if (dto.getPrice() != null) {
            item.setPrice(dto.getPrice());
        }
        if (dto.getCategory() != null) {
            item.setCategory(dto.getCategory());
        }
        if (dto.getQuantityAvailable() != null) {
            item.setQuantityAvailable(dto.getQuantityAvailable());
        }
        if (dto.getIsAvailable() != null) {
            item.setIsAvailable(dto.getIsAvailable());
        }
        if (dto.getImageUrl() != null) {
            item.setImageUrl(dto.getImageUrl());
        }

        return MenuItemDto.fromEntity(menuItemRepository.save(item));
    }

    public void deleteMenuItem(Long id, Long ownerId) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));

        Truck truck = truckRepository.findById(item.getTruckId())
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", item.getTruckId()));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        menuItemRepository.delete(item);
    }

    public List<MenuItemDto> getMenuByTruckId(Long truckId) {
        List<MenuItem> items = menuItemRepository.findByTruckIdAndIsAvailableTrue(truckId);
        return items.stream()
                .map(MenuItemDto::fromEntity)
                .collect(Collectors.toList());
    }

    public MenuItemDto updateInventory(Long id, Integer newQuantity, Long ownerId) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));

        Truck truck = truckRepository.findById(item.getTruckId())
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", item.getTruckId()));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        item.setQuantityAvailable(newQuantity);
        if (newQuantity <= 0) {
            item.setIsAvailable(false);
        }

        return MenuItemDto.fromEntity(menuItemRepository.save(item));
    }
}
