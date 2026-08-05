package com.truckbites.order.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Degrades gracefully when user-service is unreachable: orders are charged
 * as non-members (full platform fee, no discount) and vendors as FREE plan
 * (highest commission). Order placement must never fail because of pricing.
 */
@Slf4j
@Component
public class UserServiceClientFallback implements FallbackFactory<UserServiceClient> {

    @Override
    public UserServiceClient create(Throwable cause) {
        log.warn("UserServiceClient fallback triggered: {}", cause.getMessage());
        return new UserServiceClient() {
            @Override
            public UserMembershipDto getMembership(Long userId) {
                return UserMembershipDto.builder()
                        .tier("NONE")
                        .active(false)
                        .platformFeePerOrder(new java.math.BigDecimal("15.00"))
                        .discountPercent(0)
                        .priorityProcessing(false)
                        .build();
            }

            @Override
            public UserVendorPlanDto getVendorPlan(Long userId) {
                return UserVendorPlanDto.builder()
                        .plan("FREE")
                        .active(false)
                        .commissionPercent(10)
                        .build();
            }
        };
    }
}
