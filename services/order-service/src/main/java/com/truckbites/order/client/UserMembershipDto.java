package com.truckbites.order.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Snapshot of a customer's membership benefits, used to compute
 * platform fees, member discounts and priority processing at checkout.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserMembershipDto {

    private String tier;
    private boolean active;
    private BigDecimal platformFeePerOrder;
    private int discountPercent;
    private boolean priorityProcessing;
}
