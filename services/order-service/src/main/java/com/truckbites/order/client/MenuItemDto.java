package com.truckbites.order.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MenuItemDto {

    private Long id;
    private Long truckId;
    private String name;
    private BigDecimal price;
    private Integer quantityAvailable;
    private Boolean isAvailable;
}
