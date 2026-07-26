package com.truckbites.menu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truckbites.menu.dto.CreateMenuItemRequest;
import com.truckbites.menu.dto.UpdateInventoryRequest;
import com.truckbites.menu.model.MenuItem;
import com.truckbites.menu.service.MenuService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MenuService menuService;

    private MenuItem createMenuItem(Long id, Long truckId, String name, BigDecimal price, boolean available) {
        return MenuItem.builder()
                .id(id)
                .truckId(truckId)
                .name(name)
                .description("Tasty " + name)
                .price(price)
                .category("Main Course")
                .quantityAvailable(available ? 10 : 0)
                .isAvailable(available)
                .build();
    }

    // ──────────── GET /api/menu/truck/{truckId} ────────────

    @Test
    @DisplayName("GET /api/menu/truck/{truckId} should return available menu items")
    void getMenuByTruck_shouldReturnMenuItems() throws Exception {
        // Arrange
        List<MenuItem> items = List.of(
                createMenuItem(1L, 1L, "Taco", new BigDecimal("5.99"), true),
                createMenuItem(2L, 1L, "Burrito", new BigDecimal("9.99"), true)
        );
        when(menuService.getMenuItemsByTruck(1L)).thenReturn(items);

        // Act & Assert
        mockMvc.perform(get("/api/menu/truck/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Taco"));
    }

    @Test
    @DisplayName("GET /api/menu/truck/{truckId} should return empty list when no items")
    void getMenuByTruck_shouldReturnEmptyList() throws Exception {
        // Arrange
        when(menuService.getMenuItemsByTruck(999L)).thenReturn(List.of());

        // Act & Assert
        mockMvc.perform(get("/api/menu/truck/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ──────────── GET /api/menu/{id} ────────────

    @Test
    @DisplayName("GET /api/menu/{id} should return menu item")
    void getMenuItem_shouldReturnItem() throws Exception {
        // Arrange
        MenuItem item = createMenuItem(1L, 1L, "Taco", new BigDecimal("5.99"), true);
        when(menuService.getMenuItemById(1L)).thenReturn(item);

        // Act & Assert
        mockMvc.perform(get("/api/menu/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Taco"))
                .andExpect(jsonPath("$.price").value(5.99));
    }

    // ──────────── POST /api/menu ────────────

    @Test
    @DisplayName("POST /api/menu should create menu item for VENDOR")
    void createMenuItem_shouldCreateAndReturn201() throws Exception {
        // Arrange
        CreateMenuItemRequest request = new CreateMenuItemRequest();
        request.setTruckId(1L);
        request.setName("New Item");
        request.setDescription("A new item");
        request.setPrice(new BigDecimal("8.99"));
        request.setCategory("Appetizer");
        request.setQuantityAvailable(15);
        request.setIsAvailable(true);

        MenuItem createdItem = createMenuItem(1L, 1L, "New Item", new BigDecimal("8.99"), true);
        when(menuService.addMenuItem(any(CreateMenuItemRequest.class), anyLong())).thenReturn(createdItem);

        // Act & Assert
        mockMvc.perform(post("/api/menu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Item"))
                .andExpect(jsonPath("$.price").value(8.99));
    }

    @Test
    @DisplayName("POST /api/menu should return 400 when request is invalid")
    void createMenuItem_shouldReturn400_whenRequestInvalid() throws Exception {
        // Arrange - missing required fields
        CreateMenuItemRequest request = new CreateMenuItemRequest();

        // Act & Assert
        mockMvc.perform(post("/api/menu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ──────────── PUT /api/menu/{id} ────────────

    @Test
    @DisplayName("PUT /api/menu/{id} should update menu item")
    void updateMenuItem_shouldUpdateAndReturn200() throws Exception {
        // Arrange
        CreateMenuItemRequest request = new CreateMenuItemRequest();
        request.setTruckId(1L);
        request.setName("Updated Item");
        request.setPrice(new BigDecimal("12.99"));
        request.setCategory("Main Course");

        MenuItem updatedItem = createMenuItem(1L, 1L, "Updated Item", new BigDecimal("12.99"), true);
        when(menuService.updateMenuItem(anyLong(), any(CreateMenuItemRequest.class), anyLong()))
                .thenReturn(updatedItem);

        // Act & Assert
        mockMvc.perform(put("/api/menu/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Item"))
                .andExpect(jsonPath("$.price").value(12.99));
    }

    // ──────────── PATCH /api/menu/{id}/inventory ────────────

    @Test
    @DisplayName("PATCH /api/menu/{id}/inventory should update inventory")
    void updateInventory_shouldUpdateAndReturn200() throws Exception {
        // Arrange
        UpdateInventoryRequest request = new UpdateInventoryRequest();
        request.setQuantity(25);

        MenuItem updatedItem = createMenuItem(1L, 1L, "Taco", new BigDecimal("5.99"), true);
        updatedItem.setQuantityAvailable(25);
        when(menuService.updateInventory(anyLong(), any(UpdateInventoryRequest.class), anyLong()))
                .thenReturn(updatedItem);

        // Act & Assert
        mockMvc.perform(patch("/api/menu/1/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantityAvailable").value(25));
    }

    // ──────────── DELETE /api/menu/{id} ────────────

    @Test
    @DisplayName("DELETE /api/menu/{id} should delete and return 204")
    void deleteMenuItem_shouldDeleteAndReturn204() throws Exception {
        // Arrange
        doNothing().when(menuService).deleteMenuItem(anyLong(), anyLong());

        // Act & Assert
        mockMvc.perform(delete("/api/menu/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
