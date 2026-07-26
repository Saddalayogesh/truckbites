package com.truckbites.truck.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateLocationRequest {

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}
