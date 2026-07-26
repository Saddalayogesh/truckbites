package com.truckbites.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "truck-service", path = "/api/trucks")
public interface TruckServiceClient {

    @GetMapping("/{id}")
    TruckDto getTruckById(@PathVariable("id") Long id);
}
