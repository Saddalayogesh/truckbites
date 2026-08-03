package com.truckbites.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "user-service", path = "/api/users",
        fallbackFactory = UserServiceClientFallback.class)
public interface UserServiceClient {

    @GetMapping("/membership")
    UserMembershipDto getMembership(@RequestParam("userId") Long userId);

    @GetMapping("/vendor-plan")
    UserVendorPlanDto getVendorPlan(@RequestParam("userId") Long userId);
}
