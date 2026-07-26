package com.truckbites.truck.dto;

import com.truckbites.truck.model.TruckStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TruckResponse {

    private Long id;
    private String name;
    private String cuisineType;
    private String description;
    private Double latitude;
    private Double longitude;
    private TruckStatus status;
    private Long ownerId;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
