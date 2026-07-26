package com.truckbites.menu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MenuItemResponse {

    private Long id;
    private Long truckId;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Integer quantityAvailable;
    private Boolean isAvailable;
    private String imageUrl;
    private LocalDateTime createdAt;
}
