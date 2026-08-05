package com.truckbites.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Request body for bulk updating order statuses")
public class BulkStatusUpdateRequest {

    @Schema(description = "List of order IDs to update", example = "[1, 2, 3]")
    private List<Long> orderIds;

    @Schema(description = "New status for all specified orders", example = "PREPARING",
            allowableValues = {"PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"})
    private String status;
}
