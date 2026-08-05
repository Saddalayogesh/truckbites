package com.truckbites.payment.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.payment.dto.CreateRazorpayOrderRequest;
import com.truckbites.payment.dto.RazorpayOrderResponse;
import com.truckbites.payment.dto.VerifyRazorpayPaymentRequest;
import com.truckbites.payment.dto.PaymentResponse;
import com.truckbites.payment.event.PaymentEventPublisher;
import com.truckbites.payment.model.Payment;
import com.truckbites.payment.model.PaymentStatus;
import com.truckbites.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    private static final String RAZORPAY_ORDER_ID = "order_test123";
    private static final String RAZORPAY_PAYMENT_ID = "pay_test123";
    private static final String RAZORPAY_SIGNATURE = "abc123signature";

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventPublisher eventPublisher;

    @Mock
    private RazorpayService razorpayService;

    @Captor
    private ArgumentCaptor<Payment> paymentCaptor;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, eventPublisher, razorpayService);
    }

    @Nested
    @DisplayName("createRazorpayOrder()")
    class CreateRazorpayOrder {

        @Test
        @DisplayName("should create a Razorpay order and map the response")
        void shouldCreateOrder() {
            // Given
            CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(499.00));
            request.setCurrency("INR");
            request.setReceipt("order_1");
            request.setDescription("TruckBites order");

            when(razorpayService.createOrder(any(), any(), any(), any()))
                    .thenReturn(new RazorpayService.RazorpayOrderResult(RAZORPAY_ORDER_ID, 49900, "INR", "rzp_test_key"));

            // When
            RazorpayOrderResponse response = paymentService.createRazorpayOrder(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(1L);
            assertThat(response.getRazorpayOrderId()).isEqualTo(RAZORPAY_ORDER_ID);
            assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(499.00));
            assertThat(response.getCurrency()).isEqualTo("INR");
            assertThat(response.getKeyId()).isEqualTo("rzp_test_key");

            verify(razorpayService).createOrder(BigDecimal.valueOf(499.00), "INR", "order_1", "TruckBites order");
        }

        @Test
        @DisplayName("should default currency to INR when not supplied")
        void shouldDefaultCurrencyToInr() {
            // Given
            CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
            request.setOrderId(2L);
            request.setAmount(BigDecimal.valueOf(99.00));

            when(razorpayService.createOrder(any(), any(), any(), any()))
                    .thenReturn(new RazorpayService.RazorpayOrderResult("order_2", 9900, "INR", "rzp_test_key"));

            // When
            RazorpayOrderResponse response = paymentService.createRazorpayOrder(request);

            // Then
            assertThat(response.getCurrency()).isEqualTo("INR");
            verify(razorpayService).createOrder(BigDecimal.valueOf(99.00), "INR", "order_2", null);
        }
    }

    @Nested
    @DisplayName("verifyAndRecordPayment()")
    class VerifyAndRecordPayment {

        private VerifyRazorpayPaymentRequest request() {
            VerifyRazorpayPaymentRequest request = new VerifyRazorpayPaymentRequest();
            request.setOrderId(42L);
            request.setAmount(BigDecimal.valueOf(499.00));
            request.setMethod("RAZORPAY");
            request.setCustomerEmail("customer@example.com");
            request.setRazorpayOrderId(RAZORPAY_ORDER_ID);
            request.setRazorpayPaymentId(RAZORPAY_PAYMENT_ID);
            request.setRazorpaySignature(RAZORPAY_SIGNATURE);
            return request;
        }

        @Test
        @DisplayName("should record payment as SUCCESS and publish order.paid when signature and amount match")
        void shouldRecordSuccessWhenSignatureAndAmountValid() {
            // Given
            when(razorpayService.verifySignature(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, RAZORPAY_SIGNATURE))
                    .thenReturn(true);
            when(razorpayService.isOrderAmountMatching(RAZORPAY_ORDER_ID, 49900L))
                    .thenReturn(true);

            Payment savedPayment = Payment.builder()
                    .id(1L)
                    .orderId(42L)
                    .customerEmail("customer@example.com")
                    .amount(BigDecimal.valueOf(499.00))
                    .status(PaymentStatus.SUCCESS)
                    .method("RAZORPAY")
                    .transactionRef(RAZORPAY_PAYMENT_ID)
                    .createdAt(LocalDateTime.now())
                    .build();
            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.verifyAndRecordPayment(request());

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(42L);
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(response.getMethod()).isEqualTo("RAZORPAY");
            assertThat(response.getTransactionRef()).isEqualTo(RAZORPAY_PAYMENT_ID);

            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(paymentCaptor.getValue().getTransactionRef()).isEqualTo(RAZORPAY_PAYMENT_ID);
            verify(eventPublisher).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should record payment as FAILED when the captured amount does not match")
        void shouldRecordFailureWhenAmountMismatch() {
            // Given
            when(razorpayService.verifySignature(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, RAZORPAY_SIGNATURE))
                    .thenReturn(true);
            when(razorpayService.isOrderAmountMatching(RAZORPAY_ORDER_ID, 49900L))
                    .thenReturn(false);

            Payment savedPayment = Payment.builder()
                    .id(6L)
                    .orderId(42L)
                    .amount(BigDecimal.valueOf(499.00))
                    .status(PaymentStatus.FAILED)
                    .method("RAZORPAY")
                    .transactionRef(RAZORPAY_PAYMENT_ID)
                    .createdAt(LocalDateTime.now())
                    .build();
            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.verifyAndRecordPayment(request());

            // Then
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(eventPublisher, never()).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should record payment as FAILED and not publish when signature is invalid")
        void shouldRecordFailureWhenSignatureInvalid() {
            // Given
            when(razorpayService.verifySignature(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, RAZORPAY_SIGNATURE))
                    .thenReturn(false);

            Payment savedPayment = Payment.builder()
                    .id(5L)
                    .orderId(42L)
                    .amount(BigDecimal.valueOf(499.00))
                    .status(PaymentStatus.FAILED)
                    .method("RAZORPAY")
                    .transactionRef(RAZORPAY_PAYMENT_ID)
                    .createdAt(LocalDateTime.now())
                    .build();
            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.verifyAndRecordPayment(request());

            // Then
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(eventPublisher, never()).publishOrderPaid(any());
        }
    }

    @Nested
    @DisplayName("getPaymentsByOrderId()")
    class GetPaymentsByOrderId {

        @Test
        @DisplayName("should return payments with all fields mapped for a given order")
        void shouldReturnPaymentsForOrder() {
            // Given
            Long orderId = 42L;
            LocalDateTime now = LocalDateTime.now();
            Payment payment1 = Payment.builder()
                    .id(1L).orderId(orderId)
                    .amount(BigDecimal.valueOf(10.50)).status(PaymentStatus.SUCCESS)
                    .method("CARD").transactionRef("TXN-001")
                    .createdAt(now)
                    .build();
            Payment payment2 = Payment.builder()
                    .id(2L).orderId(orderId)
                    .amount(BigDecimal.valueOf(20.00)).status(PaymentStatus.FAILED)
                    .method("RAZORPAY").transactionRef("TXN-002")
                    .createdAt(now.minusMinutes(5))
                    .build();

            when(paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId))
                    .thenReturn(List.of(payment1, payment2));

            // When
            List<PaymentResponse> responses = paymentService.getPaymentsByOrderId(orderId);

            // Then
            assertThat(responses).hasSize(2);

            assertThat(responses.get(0).getId()).isEqualTo(1L);
            assertThat(responses.get(0).getOrderId()).isEqualTo(42L);
            assertThat(responses.get(0).getAmount()).isEqualByComparingTo(BigDecimal.valueOf(10.50));
            assertThat(responses.get(0).getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(responses.get(0).getMethod()).isEqualTo("CARD");
            assertThat(responses.get(0).getTransactionRef()).isEqualTo("TXN-001");
            assertThat(responses.get(0).getCreatedAt()).isEqualTo(now);

            assertThat(responses.get(1).getId()).isEqualTo(2L);
            assertThat(responses.get(1).getOrderId()).isEqualTo(42L);
            assertThat(responses.get(1).getAmount()).isEqualByComparingTo(BigDecimal.valueOf(20.00));
            assertThat(responses.get(1).getStatus()).isEqualTo(PaymentStatus.FAILED);
            assertThat(responses.get(1).getMethod()).isEqualTo("RAZORPAY");
            assertThat(responses.get(1).getTransactionRef()).isEqualTo("TXN-002");
            assertThat(responses.get(1).getCreatedAt()).isEqualTo(now.minusMinutes(5));

            verify(paymentRepository).findByOrderIdOrderByCreatedAtDesc(orderId);
        }

        @Test
        @DisplayName("should return empty list when no payments exist")
        void shouldReturnEmptyListWhenNoPayments() {
            // Given
            Long orderId = 999L;
            when(paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId))
                    .thenReturn(List.of());

            // When
            List<PaymentResponse> responses = paymentService.getPaymentsByOrderId(orderId);

            // Then
            assertThat(responses).isEmpty();
        }
    }

    @Nested
    @DisplayName("getPaymentById()")
    class GetPaymentById {

        @Test
        @DisplayName("should return payment with all fields mapped when found")
        void shouldReturnPaymentWhenFound() {
            // Given
            Long paymentId = 1L;
            LocalDateTime now = LocalDateTime.now();
            Payment payment = Payment.builder()
                    .id(paymentId).orderId(42L)
                    .amount(BigDecimal.valueOf(15.99)).status(PaymentStatus.SUCCESS)
                    .method("RAZORPAY").transactionRef("TXN-ABC")
                    .createdAt(now)
                    .build();

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            // When
            PaymentResponse response = paymentService.getPaymentById(paymentId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(paymentId);
            assertThat(response.getOrderId()).isEqualTo(42L);
            assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(15.99));
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(response.getMethod()).isEqualTo("RAZORPAY");
            assertThat(response.getTransactionRef()).isEqualTo("TXN-ABC");
            assertThat(response.getCreatedAt()).isEqualTo(now);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when payment not found")
        void shouldThrowWhenNotFound() {
            // Given
            Long paymentId = 999L;
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> paymentService.getPaymentById(paymentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(String.valueOf(paymentId));
        }
    }
}
