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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private TruckServiceClient truckServiceClient;

    @InjectMocks
    private MenuService menuService;

    private TruckDto createTruckDto(Long id, Long ownerId) {
        return TruckDto.builder()
                .id(id)
                .ownerId(ownerId)
                .name("Test Truck")
                .build();
    }

    private MenuItem createMenuItem(Long id, Long truckId, String name, BigDecimal price, boolean available, int quantity) {
        return MenuItem.builder()
                .id(id)
                .truckId(truckId)
                .name(name)
                .description("Delicious " + name)
                .price(price)
                .category("Main Course")
                .quantityAvailable(quantity)
                .isAvailable(available)
                .imageUrl("https://example.com/" + name.toLowerCase() + ".jpg")
                .build();
    }

    private CreateMenuItemRequest createDefaultRequest(Long truckId) {
        CreateMenuItemRequest request = new CreateMenuItemRequest();
        request.setTruckId(truckId);
        request.setName("Burrito");
        request.setDescription("A tasty burrito");
        request.setPrice(new BigDecimal("9.99"));
        request.setCategory("Main Course");
        request.setQuantityAvailable(10);
        request.setIsAvailable(true);
        return request;
    }

    // ──────────── addMenuItem ────────────

    @Test
    @DisplayName("Should create menu item after validating truck ownership")
    void addMenuItem_shouldCreateAndReturnMenuItem() {
        // Arrange
        Long truckId = 1L;
        Long ownerId = 42L;
        CreateMenuItemRequest request = createDefaultRequest(truckId);

        TruckDto truckDto = createTruckDto(truckId, ownerId);
        when(truckServiceClient.getTruckById(truckId)).thenReturn(truckDto);

        MenuItem savedItem = createMenuItem(1L, truckId, "Burrito", new BigDecimal("9.99"), true, 10);
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(savedItem);

        // Act
        MenuItem result = menuService.addMenuItem(request, ownerId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Burrito");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("9.99"));

        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when truck not found")
    void addMenuItem_shouldThrowException_whenTruckNotFound() {
        // Arrange
        Long truckId = 999L;
        CreateMenuItemRequest request = createDefaultRequest(truckId);

        when(truckServiceClient.getTruckById(truckId))
                .thenThrow(mock(FeignException.NotFound.class));

        // Act & Assert
        assertThatThrownBy(() -> menuService.addMenuItem(request, 42L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Truck not found with id: " + truckId);

        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when user does not own the truck")
    void addMenuItem_shouldThrowException_whenNotOwner() {
        // Arrange
        Long truckId = 1L;
        CreateMenuItemRequest request = createDefaultRequest(truckId);

        TruckDto truckDto = createTruckDto(truckId, 99L); // Different owner
        when(truckServiceClient.getTruckById(truckId)).thenReturn(truckDto);

        // Act & Assert
        assertThatThrownBy(() -> menuService.addMenuItem(request, 42L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("You do not own this truck");

        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should set isAvailable to false when quantity is 0")
    void addMenuItem_shouldSetUnavailable_whenQuantityZero() {
        // Arrange
        Long truckId = 1L;
        Long ownerId = 42L;
        CreateMenuItemRequest request = createDefaultRequest(truckId);
        request.setQuantityAvailable(0);
        request.setIsAvailable(true); // explicitly set true but quantity is 0

        when(truckServiceClient.getTruckById(truckId)).thenReturn(createTruckDto(truckId, ownerId));

        MenuItem savedItem = createMenuItem(1L, truckId, "Burrito", new BigDecimal("9.99"), false, 0);
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(savedItem);

        // Act
        MenuItem result = menuService.addMenuItem(request, ownerId);

        // Assert
        assertThat(result.getIsAvailable()).isFalse();
    }

    // ──────────── getMenuItemById ────────────

    @Test
    @DisplayName("Should return menu item when id exists")
    void getMenuItemById_shouldReturnItem_whenExists() {
        // Arrange
        MenuItem item = createMenuItem(1L, 1L, "Taco", new BigDecimal("5.99"), true, 20);
        when(menuItemRepository.findById(1L)).thenReturn(Optional.of(item));

        // Act
        MenuItem result = menuService.getMenuItemById(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Taco");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("5.99"));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when item not found")
    void getMenuItemById_shouldThrowException_whenNotFound() {
        // Arrange
        when(menuItemRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> menuService.getMenuItemById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ──────────── getMenuItemsByTruck ────────────

    @Test
    @DisplayName("Should return available items for truck")
    void getMenuItemsByTruck_shouldReturnAvailableItems() {
        // Arrange
        Long truckId = 1L;
        List<MenuItem> items = List.of(
                createMenuItem(1L, truckId, "Taco", new BigDecimal("5.99"), true, 20),
                createMenuItem(2L, truckId, "Enchilada", new BigDecimal("7.99"), true, 15)
        );
        when(menuItemRepository.findByTruckIdAndIsAvailableTrue(truckId)).thenReturn(items);

        // Act
        List<MenuItem> result = menuService.getMenuItemsByTruck(truckId);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(MenuItem::getIsAvailable);
        verify(menuItemRepository).findByTruckIdAndIsAvailableTrue(truckId);
    }

    @Test
    @DisplayName("Should return empty list for truck with no items")
    void getMenuItemsByTruck_shouldReturnEmptyList_whenNoItems() {
        // Arrange
        when(menuItemRepository.findByTruckIdAndIsAvailableTrue(999L)).thenReturn(List.of());

        // Act
        List<MenuItem> result = menuService.getMenuItemsByTruck(999L);

        // Assert
        assertThat(result).isEmpty();
    }

    // ──────────── updateMenuItem ────────────

    @Test
    @DisplayName("Should update menu item when owner validated")
    void updateMenuItem_shouldUpdateAndReturnItem() {
        // Arrange
        Long truckId = 1L;
        Long ownerId = 42L;
        Long itemId = 1L;

        when(truckServiceClient.getTruckById(truckId)).thenReturn(createTruckDto(truckId, ownerId));

        MenuItem existingItem = createMenuItem(itemId, truckId, "Old Name", new BigDecimal("5.99"), true, 10);
        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(existingItem));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateMenuItemRequest request = createDefaultRequest(truckId);
        request.setName("Updated Name");
        request.setPrice(new BigDecimal("12.99"));

        // Act
        MenuItem result = menuService.updateMenuItem(itemId, request, ownerId);

        // Assert
        assertThat(result.getName()).isEqualTo("Updated Name");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("12.99"));

        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository).findById(itemId);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    // ──────────── updateInventory ────────────

    @Test
    @DisplayName("Should update inventory and auto-flip availability when quantity is 0")
    void updateInventory_shouldAutoFlipAvailability_whenQuantityZero() {
        // Arrange
        Long itemId = 1L;
        Long truckId = 1L;
        Long ownerId = 42L;

        MenuItem existingItem = createMenuItem(itemId, truckId, "Taco", new BigDecimal("5.99"), true, 5);
        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(existingItem));
        when(truckServiceClient.getTruckById(truckId)).thenReturn(createTruckDto(truckId, ownerId));

        UpdateInventoryRequest request = new UpdateInventoryRequest();
        request.setQuantity(0);

        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MenuItem result = menuService.updateInventory(itemId, request, ownerId);

        // Assert
        assertThat(result.getQuantityAvailable()).isZero();
        assertThat(result.getIsAvailable()).isFalse(); // auto-flipped

        verify(menuItemRepository).findById(itemId);
        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    @Test
    @DisplayName("Should update inventory and keep available when quantity > 0")
    void updateInventory_shouldKeepAvailable_whenQuantityPositive() {
        // Arrange
        Long itemId = 1L;
        Long truckId = 1L;
        Long ownerId = 42L;

        MenuItem existingItem = createMenuItem(itemId, truckId, "Taco", new BigDecimal("5.99"), true, 5);
        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(existingItem));
        when(truckServiceClient.getTruckById(truckId)).thenReturn(createTruckDto(truckId, ownerId));

        UpdateInventoryRequest request = new UpdateInventoryRequest();
        request.setQuantity(25);

        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MenuItem result = menuService.updateInventory(itemId, request, ownerId);

        // Assert
        assertThat(result.getQuantityAvailable()).isEqualTo(25);
        assertThat(result.getIsAvailable()).isTrue(); // unchanged

        verify(menuItemRepository).findById(itemId);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    // ──────────── deleteMenuItem ────────────

    @Test
    @DisplayName("Should delete menu item when owner validated")
    void deleteMenuItem_shouldDelete_whenOwnerValidated() {
        // Arrange
        Long itemId = 1L;
        Long truckId = 1L;
        Long ownerId = 42L;

        MenuItem item = createMenuItem(itemId, truckId, "Taco", new BigDecimal("5.99"), true, 5);
        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(truckServiceClient.getTruckById(truckId)).thenReturn(createTruckDto(truckId, ownerId));

        // Act
        menuService.deleteMenuItem(itemId, ownerId);

        // Assert
        verify(menuItemRepository).findById(itemId);
        verify(truckServiceClient).getTruckById(truckId);
        verify(menuItemRepository).delete(item);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent item")
    void deleteMenuItem_shouldThrowException_whenNotFound() {
        // Arrange
        when(menuItemRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> menuService.deleteMenuItem(999L, 42L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(menuItemRepository).findById(999L);
        verify(menuItemRepository, never()).delete(any());
    }
}
