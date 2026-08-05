package com.truckbites.payment.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.payment.dto.CreateRazorpayOrderRequest;
import com.truckbites.payment.dto.RazorpayOrderResponse;
import com.truckbites.payment.dto.VerifyRazorpayPaymentRequest;
import com.truckbites.payment.dto.PaymentResponse;
import com.truckbites.payment.event.OrderPaidEvent;
import com.truckbites.payment.event.PaymentEventPublisher;
import com.truckbites.payment.model.Payment;
import com.truckbites.payment.model.PaymentStatus;
import com.truckbites.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher eventPublisher;
    private final RazorpayService razorpayService;

    /**
     * Creates a Razorpay order for the given amount. The returned order id is
     * what the frontend uses to initialise the Razorpay Checkout modal.
     */
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest request) {
        String currency = (request.getCurrency() != null && !request.getCurrency().isBlank())
                ? request.getCurrency() : "INR";
        String receipt = (request.getReceipt() != null && !request.getReceipt().isBlank())
                ? request.getReceipt()
                : (request.getOrderId() != null
                    ? "order_" + request.getOrderId()
                    : "receipt_" + System.currentTimeMillis());

        RazorpayService.RazorpayOrderResult result =
                razorpayService.createOrder(request.getAmount(), currency, receipt, request.getDescription());
        log.info("Razorpay order ready: orderId={}, razorpayOrderId={}, amount={} {}",
                request.getOrderId(), result.razorpayOrderId(), request.getAmount(), currency);

        return RazorpayOrderResponse.builder()
                .orderId(request.getOrderId())
                .razorpayOrderId(result.razorpayOrderId())
                .amount(request.getAmount())
                .currency(currency)
                .keyId(result.keyId())
                .build();
    }

    /**
     * Verifies the Razorpay payment signature and records the payment.
     * A valid signature stores the payment as SUCCESS and publishes an
     * order.paid event; an unverifiable payment is stored as FAILED.
     */
    @Transactional
    public PaymentResponse verifyAndRecordPayment(VerifyRazorpayPaymentRequest request) {
        log.info("Verifying Razorpay payment: orderId={}, razorpayOrderId={}, paymentId={}",
                request.getOrderId(), request.getRazorpayOrderId(), request.getRazorpayPaymentId());

        boolean signatureValid = razorpayService.verifySignature(
                request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getRazorpaySignature());
        // Only hit the Razorpay API to cross-check the captured amount when the
        // signature already checks out — avoids outbound calls on forged attempts.
        boolean amountMatches = false;
        if (signatureValid) {
            long expectedPaise = request.getAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValueExact();
            amountMatches = razorpayService.isOrderAmountMatching(
                    request.getRazorpayOrderId(), expectedPaise);
        }
        PaymentStatus status = (signatureValid && amountMatches)
                ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .customerEmail(request.getCustomerEmail())
                .amount(request.getAmount())
                .status(status)
                .method(request.getMethod() != null ? request.getMethod() : "RAZORPAY")
                .transactionRef(request.getRazorpayPaymentId())
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
