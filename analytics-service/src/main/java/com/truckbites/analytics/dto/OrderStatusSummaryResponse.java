package com.truckbites.analytics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Order count grouped by status for a truck")
public class OrderStatusSummaryResponse {

    @Schema(description = "Order status", example = "PLACED")
    private String status;

    @Schema(description = "Number of orders in this status", example = "12")
    private Long count;
}
