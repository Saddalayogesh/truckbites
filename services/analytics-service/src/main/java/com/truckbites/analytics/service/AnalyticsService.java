package com.truckbites.analytics.service;

import com.truckbites.analytics.client.TruckDto;
import com.truckbites.analytics.client.TruckServiceClient;
import com.truckbites.analytics.dto.DailySalesResponse;
import com.truckbites.analytics.dto.OrderStatusSummaryResponse;
import com.truckbites.analytics.dto.TopSellingItemResponse;
import com.truckbites.analytics.repository.AnalyticsRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service layer for analytics queries.
 * All methods validate truck ownership via Feign call to truck-service
 * before executing read-only aggregation queries against order_db.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final TruckServiceClient truckServiceClient;

    /**
     * Validates that the truck exists and the given userId is the owner.
     */
    public void validateTruckOwnership(Long truckId, Long ownerId) {
        log.debug("Validating truck ownership: truckId={}, ownerId={}", truckId, ownerId);
        try {
            TruckDto truck = truckServiceClient.getTruckById(truckId);
            if (!truck.getOwnerId().equals(ownerId)) {
                log.warn("User {} does not own truck {}", ownerId, truckId);
                throw new SecurityException("You do not own this truck");
            }
            log.debug("Truck ownership validated: truckId={}", truckId);
        } catch (FeignException.NotFound e) {
            log.warn("Truck not found: truckId={}", truckId);
            throw new IllegalArgumentException("Truck not found with id: " + truckId);
        } catch (FeignException e) {
            log.error("Failed to call truck-service for truckId: {}", truckId, e);
            throw new IllegalStateException("Unable to validate truck ownership. Please try again later.");
        }
    }

    /**
     * Returns daily sales for a specific truck.
     */
    public List<DailySalesResponse> getDailySales(Long truckId, Long ownerId) {
        validateTruckOwnership(truckId, ownerId);
        log.info("Fetching daily sales for truckId: {}", truckId);
        return analyticsRepository.findDailySales(truckId);
    }

    /**
     * Returns top-selling items for a specific truck.
     */
    public List<TopSellingItemResponse> getTopSellingItems(Long truckId, Long ownerId) {
        validateTruckOwnership(truckId, ownerId);
        log.info("Fetching top selling items for truckId: {}", truckId);
        return analyticsRepository.findTopSellingItems(truckId);
    }

    /**
     * Returns order counts by status for a specific truck.
     */
    public List<OrderStatusSummaryResponse> getOrderCountByStatus(Long truckId, Long ownerId) {
        validateTruckOwnership(truckId, ownerId);
        log.info("Fetching order count by status for truckId: {}", truckId);
        return analyticsRepository.findOrderCountByStatus(truckId);
    }
}
