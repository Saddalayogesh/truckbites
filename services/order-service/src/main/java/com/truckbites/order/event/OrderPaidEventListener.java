package com.truckbites.order.event;

import com.truckbites.order.model.Order;
import com.truckbites.order.model.OrderStatus;
import com.truckbites.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderPaidEventListener {

    private final OrderRepository orderRepository;

    /**
     * Handles order.paid events and auto-updates the order from PLACED to PREPARING.
     */
    @Transactional
    @RabbitListener(queues = "${app.rabbitmq.queue.order-paid:order.paid.queue}")
    public void handleOrderPaid(OrderPaidEvent event) {
        log.info("Received order.paid event: paymentId={}, orderId={}, status={}",
                event.getPaymentId(), event.getOrderId(), event.getStatus());

        Order order = orderRepository.findById(event.getOrderId()).orElse(null);
        if (order == null) {
            log.warn("Order not found for orderId={}, cannot update status", event.getOrderId());
            return;
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            log.info("Order {} status is {}, skipping PAID → PREPARING transition",
                    event.getOrderId(), order.getStatus());
            return;
        }

        order.setStatus(OrderStatus.PREPARING);
        orderRepository.save(order);
        log.info("Order {} status updated: PLACED → PREPARING (paymentId={})",
                event.getOrderId(), event.getPaymentId());
    }
}
