package com.truckbites.truck.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTruckRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Cuisine type is required")
    private String cuisineType;

    private String description;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String imageUrl;
}
