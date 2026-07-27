package com.truckbites.order.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:truckbites.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key.order-placed:order.placed}")
    private String orderPlacedRoutingKey;

    /**
     * Publishes an event when an order is successfully placed.
     */
    public void publishOrderPlaced(OrderPlacedEvent event) {
        log.info("Publishing order.placed event for orderId: {}", event.getOrderId());
        rabbitTemplate.convertAndSend(exchange, orderPlacedRoutingKey, event);
        log.debug("order.placed event published for orderId: {}", event.getOrderId());
    }
}
