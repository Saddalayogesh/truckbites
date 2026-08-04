package com.truckbites.payment.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.payment.dto.PaymentRequest;
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

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventPublisher eventPublisher;

    @Captor
    private ArgumentCaptor<Payment> paymentCaptor;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, eventPublisher);
    }

    @Nested
    @DisplayName("processPayment()")
    class ProcessPayment {

        @Test
        @DisplayName("should process payment successfully with valid amount")
        void shouldProcessPaymentSuccessfully() {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(25.00));
            request.setMethod("CARD");
            request.setTransactionRef("TXN-TEST123");

            Payment savedPayment = Payment.builder()
                    .id(1L)
                    .orderId(1L)
                    .amount(BigDecimal.valueOf(25.00))
                    .status(PaymentStatus.SUCCESS)
                    .method("CARD")
                    .transactionRef("TXN-TEST123-1")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.processPayment(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getOrderId()).isEqualTo(1L);
            assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(25.00));
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            assertThat(response.getMethod()).isEqualTo("CARD");
            assertThat(response.getTransactionRef()).isEqualTo("TXN-TEST123-1");
            assertThat(response.getCreatedAt()).isNotNull();

            verify(paymentRepository).save(any(Payment.class));
            verify(eventPublisher).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should fail payment when UPI transaction reference is missing")
        void shouldFailPaymentWhenTransactionRefMissing() {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(25.00));
            request.setMethod("UPI");
            // No transactionRef supplied — payment cannot be verified

            Payment savedPayment = Payment.builder()
                    .id(5L)
                    .orderId(1L)
                    .amount(BigDecimal.valueOf(25.00))
                    .status(PaymentStatus.FAILED)
                    .method("UPI")
                    .transactionRef("TXN-GEN")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.processPayment(request);

            // Then
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(eventPublisher, never()).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should fail payment when amount is zero")
        void shouldFailPaymentWhenAmountIsZero() {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.ZERO);
            request.setMethod("CARD");
            request.setTransactionRef("TXN-ZERO123");

            Payment savedPayment = Payment.builder()
                    .id(2L)
                    .orderId(1L)
                    .amount(BigDecimal.ZERO)
                    .status(PaymentStatus.FAILED)
                    .method("CARD")
                    .transactionRef("TXN-FAILED")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.processPayment(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);

            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(eventPublisher, never()).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should fail payment when amount is negative")
        void shouldFailPaymentWhenAmountIsNegative() {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(-10.00));
            request.setMethod("CARD");
            request.setTransactionRef("TXN-NEG1234");

            Payment savedPayment = Payment.builder()
                    .id(3L)
                    .orderId(1L)
                    .amount(BigDecimal.valueOf(-10.00))
                    .status(PaymentStatus.FAILED)
                    .method("CARD")
                    .transactionRef("TXN-FAILED")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            PaymentResponse response = paymentService.processPayment(request);

            // Then
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);

            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);
            verify(eventPublisher, never()).publishOrderPaid(any());
        }

        @Test
        @DisplayName("should save payment with correct orderId and method")
        void shouldSavePaymentWithCorrectFields() {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(42L);
            request.setAmount(BigDecimal.valueOf(15.50));
            request.setMethod("UPI");
            request.setTransactionRef("TXN-UPI123");

            Payment savedPayment = Payment.builder()
                    .id(4L)
                    .orderId(42L)
                    .amount(BigDecimal.valueOf(15.50))
                    .status(PaymentStatus.SUCCESS)
                    .method("UPI")
                    .transactionRef("TXN-UPI123")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

            // When
            paymentService.processPayment(request);

            // Then
            verify(paymentRepository).save(paymentCaptor.capture());
            Payment captured = paymentCaptor.getValue();

            assertThat(captured.getOrderId()).isEqualTo(42L);
            assertThat(captured.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(15.50));
            assertThat(captured.getMethod()).isEqualTo("UPI");
            assertThat(captured.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            // The customer-provided UTR is stored, suffixed with the orderId to stay unique
            assertThat(captured.getTransactionRef()).isEqualTo("TXN-UPI123-42");
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
                    .method("UPI").transactionRef("TXN-002")
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
            assertThat(responses.get(1).getMethod()).isEqualTo("UPI");
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
                    .method("UPI").transactionRef("TXN-ABC")
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
            assertThat(response.getMethod()).isEqualTo("UPI");
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
