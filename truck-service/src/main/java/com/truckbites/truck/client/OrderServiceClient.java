package com.truckbites.truck.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client to validate order details from order-service.
 */
@FeignClient(name = "order-service", path = "/api/orders")
public interface OrderServiceClient {

    /**
     * Fetches order details by ID to validate the order exists and is COMPLETED.
     */
    @GetMapping("/{id}")
    OrderDto getOrderById(@PathVariable("id") Long id);
}
