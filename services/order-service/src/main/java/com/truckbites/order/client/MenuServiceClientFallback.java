package com.truckbites.order.client;

import com.truckbites.common.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MenuServiceClientFallback implements FallbackFactory<MenuServiceClient> {

    @Override
    public MenuServiceClient create(Throwable cause) {
        log.error("MenuServiceClient fallback triggered: {}", cause.getMessage());
        return id -> {
            throw new ServiceUnavailableException("Menu service is currently unavailable. Please try again later.", cause);
        };
    }
}
