package com.truckbites.payment.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:payment-exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key.order-paid:order.paid}")
    private String orderPaidRoutingKey;

    /**
     * Publishes an event when a payment is successfully processed.
     */
    public void publishOrderPaid(OrderPaidEvent event) {
        log.info("Publishing order.paid event for paymentId: {}, orderId: {}",
                event.getPaymentId(), event.getOrderId());
        rabbitTemplate.convertAndSend(exchange, orderPaidRoutingKey, event);
        log.debug("order.paid event published for paymentId: {}", event.getPaymentId());
    }
}
