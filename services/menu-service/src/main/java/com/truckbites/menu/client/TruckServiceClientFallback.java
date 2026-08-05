package com.truckbites.menu.client;

import com.truckbites.common.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TruckServiceClientFallback implements FallbackFactory<TruckServiceClient> {

    @Override
    public TruckServiceClient create(Throwable cause) {
        log.error("TruckServiceClient fallback triggered: {}", cause.getMessage());
        return id -> {
            throw new ServiceUnavailableException("Truck service is currently unavailable. Please try again later.", cause);
        };
    }
}
