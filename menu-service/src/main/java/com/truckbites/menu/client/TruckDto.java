package com.truckbites.menu.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TruckDto {

    private Long id;
    private Long ownerId;
    private String name;
}
