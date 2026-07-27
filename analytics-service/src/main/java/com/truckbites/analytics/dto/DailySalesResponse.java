package com.truckbites.analytics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Daily sales summary for a truck")
public class DailySalesResponse {

    @Schema(description = "Date of sales", example = "2026-07-27")
    private LocalDate date;

    @Schema(description = "Total sales amount for the day", example = "245.50")
    private BigDecimal totalSales;
}
