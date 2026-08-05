package com.truckbites.analytics.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client to validate truck ownership from truck-service.
 */
@FeignClient(name = "truck-service", path = "/api/trucks",
        fallbackFactory = TruckServiceClientFallback.class)
public interface TruckServiceClient {

    /**
     * Fetches truck details to validate the truck exists and determine ownership.
     */
    @GetMapping("/{id}")
    TruckDto getTruckById(@PathVariable("id") Long id);
}
