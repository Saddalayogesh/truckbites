package com.truckbites.truck.client;

import com.truckbites.common.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderServiceClientFallback implements FallbackFactory<OrderServiceClient> {

    @Override
    public OrderServiceClient create(Throwable cause) {
        log.error("OrderServiceClient fallback triggered: {}", cause.getMessage());
        return id -> {
            throw new ServiceUnavailableException("Order service is currently unavailable. Please try again later.", cause);
        };
    }
}
