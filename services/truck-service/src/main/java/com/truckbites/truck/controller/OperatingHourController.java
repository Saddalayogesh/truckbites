package com.truckbites.truck.controller;

import com.truckbites.truck.model.OperatingHour;
import com.truckbites.truck.service.OperatingHourService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/trucks/{truckId}/hours")
@RequiredArgsConstructor
@Tag(name = "Operating Hours", description = "Truck operating hours management")
public class OperatingHourController {

    private final OperatingHourService operatingHourService;

    @GetMapping
    @Operation(summary = "Get operating hours for a truck")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of operating hours returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OperatingHour.class)))),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<List<OperatingHour>> getHours(@PathVariable Long truckId) {
        log.info("Get hours for truckId: {}", truckId);
        return ResponseEntity.ok(operatingHourService.getHoursByTruck(truckId));
    }

    @PutMapping
    @Operation(summary = "Set operating hours for a truck")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Operating hours saved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OperatingHour.class)))),
            @ApiResponse(responseCode = "400", description = "Validation failed - invalid hours data"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - not your truck"),
            @ApiResponse(responseCode = "404", description = "Truck not found")
    })
    public ResponseEntity<List<OperatingHour>> setHours(
            @PathVariable Long truckId,
            @RequestBody List<OperatingHour> hoursList,
            Authentication authentication) {
        log.info("Set hours for truckId: {} ({} entries)", truckId, hoursList.size());
        return ResponseEntity.ok(operatingHourService.setAllHours(truckId, hoursList));
    }
}
