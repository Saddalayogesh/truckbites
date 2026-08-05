package com.truckbites.analytics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Top-selling menu item for a truck")
public class TopSellingItemResponse {

    @Schema(description = "Name of the menu item", example = "Street Taco")
    private String itemName;

    @Schema(description = "Total quantity sold", example = "47")
    private Long totalQuantity;

    @Schema(description = "Total revenue from this item", example = "187.53")
    private BigDecimal totalRevenue;
}
