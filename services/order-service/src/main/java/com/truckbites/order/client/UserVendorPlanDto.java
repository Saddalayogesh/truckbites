package com.truckbites.order.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Snapshot of a vendor's subscription plan, used to compute the
 * platform commission on each successful order.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserVendorPlanDto {

    private String plan;
    private boolean active;
    private int commissionPercent;
}
