package com.truckbites.truck.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for updating a food truck's GPS location.
 */
@Data
@Schema(description = "Request body for updating truck GPS location")
public class UpdateLocationRequest {

    @NotNull(message = "Latitude is required")
    @Schema(description = "New GPS latitude", example = "40.7580", requiredMode = Schema.RequiredMode.REQUIRED)
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @Schema(description = "New GPS longitude", example = "-73.9855", requiredMode = Schema.RequiredMode.REQUIRED)
    private Double longitude;
}
