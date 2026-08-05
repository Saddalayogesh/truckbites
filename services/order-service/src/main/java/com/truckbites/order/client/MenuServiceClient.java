package com.truckbites.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "menu-service", path = "/api/menu",
        fallbackFactory = MenuServiceClientFallback.class)
public interface MenuServiceClient {

    /**
     * Fetch a menu item by ID to validate existence, availability, and snapshot name/price.
     */
    @GetMapping("/{id}")
    MenuItemDto getMenuItemById(@PathVariable("id") Long id);
}
