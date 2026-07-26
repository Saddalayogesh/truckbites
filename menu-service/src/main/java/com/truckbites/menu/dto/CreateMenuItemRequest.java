package com.truckbites.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateMenuItemRequest {

    @NotNull(message = "Truck ID is required")
    private Long truckId;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal price;

    @NotBlank(message = "Category is required")
    private String category;

    @PositiveOrZero(message = "Quantity must be zero or positive")
    private Integer quantityAvailable;

    private Boolean isAvailable;

    private String imageUrl;
}
