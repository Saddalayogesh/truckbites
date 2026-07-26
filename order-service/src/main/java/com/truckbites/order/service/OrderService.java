package com.truckbites.order.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.order.client.MenuItemDto;
import com.truckbites.order.client.MenuServiceClient;
import com.truckbites.order.client.TruckDto;
import com.truckbites.order.client.TruckServiceClient;
import com.truckbites.order.dto.CreateOrderRequest;
import com.truckbites.order.dto.OrderResponse;
import com.truckbites.order.dto.OrderStatusUpdateRequest;
import com.truckbites.order.event.OrderEventPublisher;
import com.truckbites.order.event.OrderPlacedEvent;
import com.truckbites.order.model.Order;
import com.truckbites.order.model.OrderItem;
import com.truckbites.order.model.OrderStatus;
import com.truckbites.order.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuServiceClient menuServiceClient;
    private final TruckServiceClient truckServiceClient;
    private final OrderEventPublisher eventPublisher;

    /**
     * Validates that the truck exists and is owned by the given ownerId.
     */
    private TruckDto validateTruckOwnership(Long truckId, Long ownerId) {
        TruckDto truck;
        try {
            truck = truckServiceClient.getTruckById(truckId);
        } catch (FeignException.NotFound e) {
            log.warn("Truck not found with id: {}", truckId);
            throw new ResourceNotFoundException("Truck not found with id: " + truckId);
        } catch (FeignException e) {
            log.error("Failed to call truck-service for truckId: {}", truckId, e);
            throw e;
        }

        if (!truck.getOwnerId().equals(ownerId)) {
            log.warn("User {} does not own truck {}", ownerId, truckId);
            throw new UnauthorizedException("You do not own this truck");
        }

        log.debug("Truck {} validated for ownerId {}", truckId, ownerId);
        return truck;
    }

    /**
     * Validates a menu item exists, is available, and has sufficient quantity.
     */
    private MenuItemDto validateMenuItem(Long menuItemId, int requestedQuantity) {
        MenuItemDto item;
        try {
            item = menuServiceClient.getMenuItemById(menuItemId);
        } catch (FeignException.NotFound e) {
            log.warn("Menu item not found with id: {}", menuItemId);
            throw new ResourceNotFoundException("Menu item not found with id: " + menuItemId);
        } catch (FeignException e) {
            log.error("Failed to call menu-service for menuItemId: {}", menuItemId, e);
            throw e;
        }

        if (Boolean.FALSE.equals(item.getIsAvailable())) {
            log.warn("Menu item {} is not available", menuItemId);
            throw new IllegalStateException("Menu item '" + item.getName() + "' is not available");
        }

        if (item.getQuantityAvailable() < requestedQuantity) {
            log.warn("Insufficient quantity for menu item {}: requested={}, available={}",
                    menuItemId, requestedQuantity, item.getQuantityAvailable());
            throw new IllegalStateException(
                    "Insufficient quantity for '" + item.getName() + "': requested " +
                    requestedQuantity + ", available " + item.getQuantityAvailable());
        }

        return item;
    }

    /**
     * Places an order: validates items via MenuServiceClient, snapshots name/price,
     * calculates total, saves with PLACED status, and publishes order.placed event.
     */
    @Transactional
    public OrderResponse placeOrder(Long customerId, CreateOrderRequest request) {
        log.info("Placing order for customerId={}, truckId={}", customerId, request.getTruckId());

        // Validate each menu item and snapshot name/price
        List<OrderItem> items = new ArrayList<>();
        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            MenuItemDto menuItem = validateMenuItem(itemReq.getMenuItemId(), itemReq.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .menuItemId(menuItem.getId())
                    .itemName(menuItem.getName())
                    .price(menuItem.getPrice())
                    .quantity(itemReq.getQuantity())
                    .build();
            items.add(orderItem);
        }

        // Calculate total from item price snapshots
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .customerId(customerId)
                .truckId(request.getTruckId())
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .items(items)
                .build();

        // Set bidirectional relationship
        order.getItems().forEach(item -> item.setOrder(order));

        Order saved = orderRepository.save(order);
        log.info("Order placed with id: {} for customerId: {}, total: {}",
                saved.getId(), customerId, totalAmount);

        // Publish order.placed event
        publishOrderPlacedEvent(saved);

        return toResponse(saved);
    }

    private void publishOrderPlacedEvent(Order order) {
        List<OrderPlacedEvent.OrderItemEvent> itemEvents = order.getItems().stream()
                .map(item -> OrderPlacedEvent.OrderItemEvent.builder()
                        .menuItemId(item.getMenuItemId())
                        .itemName(item.getItemName())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .toList();

        OrderPlacedEvent event = OrderPlacedEvent.builder()
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .truckId(order.getTruckId())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(itemEvents)
                .build();

        eventPublisher.publishOrderPlaced(event);
    }

    public OrderResponse getOrderById(Long id) {
        log.debug("Fetching order by id: {}", id);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Order not found with id: {}", id);
                    return new ResourceNotFoundException("Order not found with id: " + id);
                });
        return toResponse(order);
    }

    public List<OrderResponse> getOrdersByCustomer(Long customerId) {
        log.debug("Fetching orders for customerId: {}", customerId);
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<OrderResponse> getOrdersByTruck(Long truckId) {
        log.debug("Fetching orders for truckId: {}", truckId);
        return orderRepository.findByTruckIdOrderByCreatedAtDesc(truckId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Updates order status. Validates that the caller (vendor) owns the truck
     * associated with the order before allowing status changes.
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request, Long vendorId) {
        log.info("Updating order status: id={}, newStatus={}, vendorId={}",
                id, request.getStatus(), vendorId);

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Order not found with id: {}", id);
                    return new ResourceNotFoundException("Order not found with id: " + id);
                });

        // Validate that the vendor owns the truck this order belongs to
        validateTruckOwnership(order.getTruckId(), vendorId);

        order.setStatus(request.getStatus());
        Order saved = orderRepository.save(order);
        log.info("Order status updated: id={}, status={}", id, request.getStatus());
        return toResponse(saved);
    }

    public List<OrderResponse> getOrdersByTruckAndStatus(Long truckId, OrderStatus status) {
        log.debug("Fetching orders for truckId={} with status={}", truckId, status);
        return orderRepository.findByTruckIdAndStatusOrderByCreatedAtAsc(truckId, status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItemId())
                        .itemName(item.getItemName())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .truckId(order.getTruckId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
