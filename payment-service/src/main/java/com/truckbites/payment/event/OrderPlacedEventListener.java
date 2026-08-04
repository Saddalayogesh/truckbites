package com.truckbites.payment.event;

import com.truckbites.payment.dto.PaymentRequest;
import com.truckbites.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderPlacedEventListener {

    private final PaymentService paymentService;

    /**
     * Handles order.placed events and triggers mock payment processing.
     * Note: auto-triggered payments carry no customer UTR, so the mock gateway
     * marks them FAILED (unverified) — the real UPI payment is verified via the
     * explicit checkout call which includes the customer's transaction reference.
     */
    @Transactional
    @RabbitListener(queues = "${app.rabbitmq.queue.order-placed:order.placed.queue}")
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("Received order.placed event: orderId={}, customerId={}, totalAmount={}",
                event.getOrderId(), event.getCustomerId(), event.getTotalAmount());

        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(event.getOrderId());
        paymentRequest.setAmount(event.getTotalAmount());
        paymentRequest.setMethod("AUTO");
        paymentRequest.setCustomerEmail(event.getCustomerEmail());

        paymentService.processPayment(paymentRequest);
        log.info("Payment processed for orderId={} via auto-listener", event.getOrderId());
    }
}
