package com.truckbites.notification.event;

import com.truckbites.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final EmailService emailService;

    /**
     * Handles order.placed events and sends an order confirmation email.
     */
    @RabbitListener(queues = "${app.rabbitmq.queue.notification:notification.queue}")
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("Received order.placed event: orderId={}, customerEmail={}, totalAmount={}",
                event.getOrderId(), event.getCustomerEmail(), event.getTotalAmount());

        if (event.getCustomerEmail() == null || event.getCustomerEmail().isBlank()) {
            log.warn("No customer email provided for orderId={}, skipping email", event.getOrderId());
            return;
        }

        String summary = buildOrderSummary(event);
        emailService.sendOrderConfirmation(event.getCustomerEmail(), event.getOrderId(), summary);
    }

    /**
     * Handles order.paid events and sends a payment receipt email.
     */
    @RabbitListener(queues = "${app.rabbitmq.queue.notification:notification.queue}")
    public void handleOrderPaid(OrderPaidEvent event) {
        log.info("Received order.paid event: paymentId={}, orderId={}, customerEmail={}, amount={}",
                event.getPaymentId(), event.getOrderId(), event.getCustomerEmail(), event.getAmount());

        if (event.getCustomerEmail() == null || event.getCustomerEmail().isBlank()) {
            log.warn("No customer email provided for orderId={}, skipping payment receipt email", event.getOrderId());
            return;
        }

        emailService.sendPaymentReceipt(
                event.getCustomerEmail(),
                event.getOrderId(),
                event.getTransactionRef(),
                event.getAmount().toPlainString());
    }

    private String buildOrderSummary(OrderPlacedEvent event) {
        StringBuilder sb = new StringBuilder();
        sb.append("Order #").append(event.getOrderId()).append("\n");
        sb.append("Total: $").append(event.getTotalAmount()).append("\n\n");
        sb.append("Items:\n");
        if (event.getItems() != null) {
            for (OrderPlacedEvent.OrderItemEvent item : event.getItems()) {
                sb.append("  • ").append(item.getItemName())
                        .append(" × ").append(item.getQuantity())
                        .append("  $").append(item.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                        .append("\n");
            }
        }
        return sb.toString();
    }
}
