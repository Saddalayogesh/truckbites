package com.truckbites.payment.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.payment.dto.PaymentRequest;
import com.truckbites.payment.dto.PaymentResponse;
import com.truckbites.payment.event.OrderPaidEvent;
import com.truckbites.payment.event.PaymentEventPublisher;
import com.truckbites.payment.model.Payment;
import com.truckbites.payment.model.PaymentStatus;
import com.truckbites.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher eventPublisher;

    /**
     * Processes a payment for the given order.
     * Delegates to the mock gateway call, saves the payment record,
     * and publishes an order.paid event on success.
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment: orderId={}, amount={}, method={}",
                request.getOrderId(), request.getAmount(), request.getMethod());

        // --- Mock gateway call ---
        PaymentStatus gatewayStatus = simulateGatewayCall(request);
        log.info("Gateway response for orderId={}: {}", request.getOrderId(), gatewayStatus);

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .customerEmail(request.getCustomerEmail())
                .amount(request.getAmount())
                .status(gatewayStatus)
                .method(request.getMethod())
                .build();

        Payment saved = paymentRepository.save(payment);
        log.info("Payment saved: id={}, orderId={}, status={}",
                saved.getId(), saved.getOrderId(), saved.getStatus());

        // Publish order.paid event only on success
        if (saved.getStatus() == PaymentStatus.SUCCESS) {
            publishOrderPaidEvent(saved);
        }

        return toResponse(saved);
    }

    /**
     * Simulates a call to an external payment gateway.
     * Returns SUCCESS unless the amount is ≤ 0.
     * <p>
     * This is a clearly-marked mock — replace with actual gateway integration.
     */
    PaymentStatus simulateGatewayCall(PaymentRequest request) {
        log.debug("Simulating payment gateway call for orderId={}, amount={}",
                request.getOrderId(), request.getAmount());

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Gateway returned FAILED: amount is ≤ 0 for orderId={}", request.getOrderId());
            return PaymentStatus.FAILED;
        }

        // Simulate slight processing delay
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Gateway simulation interrupted for orderId={}", request.getOrderId());
        }

        log.debug("Gateway returned SUCCESS for orderId={}", request.getOrderId());
        return PaymentStatus.SUCCESS;
    }

    private void publishOrderPaidEvent(Payment payment) {
        OrderPaidEvent event = OrderPaidEvent.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .customerEmail(payment.getCustomerEmail())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .transactionRef(payment.getTransactionRef())
                .status(payment.getStatus().name())
                .createdAt(payment.getCreatedAt())
                .build();

        eventPublisher.publishOrderPaid(event);
    }

    public PaymentResponse getPaymentById(Long id) {
        log.debug("Fetching payment by id: {}", id);
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Payment not found with id: {}", id);
                    return new ResourceNotFoundException("Payment not found with id: " + id);
                });
        return toResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByOrderId(Long orderId) {
        log.debug("Fetching payments for orderId: {}", orderId);
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .method(payment.getMethod())
                .transactionRef(payment.getTransactionRef())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
