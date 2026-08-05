package com.truckbites.order.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api/orders/events")
@Tag(name = "Order Events (SSE)", description = "Server-Sent Events endpoints for real-time order notifications")
public class OrderSSEController {

    private final Map<Long, SseEmitter> vendorEmitters = new ConcurrentHashMap<>();
    private final Map<Long, SseEmitter> customerEmitters = new ConcurrentHashMap<>();

    @GetMapping(value = "/vendor/{vendorId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to vendor order events (SSE)",
            description = "Opens a Server-Sent Events stream for real-time order notifications. " +
                    "Events: new_order (when a customer places an order), order_update (when status changes).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "SSE stream established",
                    content = @Content(mediaType = "text/event-stream")),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public SseEmitter subscribeVendor(
            @Parameter(description = "Vendor's user ID to receive notifications for", example = "1")
            @PathVariable Long vendorId) {
        log.info("Vendor SSE subscription: {}", vendorId);
        SseEmitter emitter = new SseEmitter(0L);
        vendorEmitters.put(vendorId, emitter);

        emitter.onCompletion(() -> vendorEmitters.remove(vendorId));
        emitter.onTimeout(() -> vendorEmitters.remove(vendorId));
        emitter.onError(e -> vendorEmitters.remove(vendorId));

        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            vendorEmitters.remove(vendorId);
        }

        return emitter;
    }

    @GetMapping(value = "/customer/{customerId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to customer order events (SSE)",
            description = "Opens a Server-Sent Events stream for real-time order status updates. " +
                    "Events: status_change (when vendor updates order status).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "SSE stream established",
                    content = @Content(mediaType = "text/event-stream")),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public SseEmitter subscribeCustomer(
            @Parameter(description = "Customer's user ID to receive notifications for", example = "1")
            @PathVariable Long customerId) {
        log.info("Customer SSE subscription: {}", customerId);
        SseEmitter emitter = new SseEmitter(0L);
        customerEmitters.put(customerId, emitter);

        emitter.onCompletion(() -> customerEmitters.remove(customerId));
        emitter.onTimeout(() -> customerEmitters.remove(customerId));
        emitter.onError(e -> customerEmitters.remove(customerId));

        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            customerEmitters.remove(customerId);
        }

        return emitter;
    }

    public void notifyVendor(Long vendorId, String eventName, String data) {
        SseEmitter emitter = vendorEmitters.get(vendorId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                vendorEmitters.remove(vendorId);
            }
        }
    }

    public void notifyCustomer(Long customerId, String eventName, String data) {
        SseEmitter emitter = customerEmitters.get(customerId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                customerEmitters.remove(customerId);
            }
        }
    }
}
