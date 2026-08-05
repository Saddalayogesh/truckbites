package com.truckbites.analytics.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal DTO for truck details needed to validate ownership.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TruckDto {

    private Long id;
    private String name;
    private Long ownerId;
}
