package com.truckbites.menu.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "truck-service", path = "/api/trucks",
        fallbackFactory = TruckServiceClientFallback.class)
public interface TruckServiceClient {

    @GetMapping("/{id}")
    TruckDto getTruckById(@PathVariable("id") Long id);
}
