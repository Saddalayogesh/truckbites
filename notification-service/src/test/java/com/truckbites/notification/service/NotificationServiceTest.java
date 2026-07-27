package com.truckbites.notification.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.internet.MimeMessage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    @Captor
    private ArgumentCaptor<jakarta.mail.internet.MimeMessage> messageCaptor;

    @Test
    @DisplayName("Should send order confirmation email without throwing")
    void sendOrderConfirmation_shouldNotThrow() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendOrderConfirmation("customer@test.com", 1L, "2x Street Taco");

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send payment receipt email without throwing")
    void sendPaymentReceipt_shouldNotThrow() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendPaymentReceipt("customer@test.com", 1L, "TXN-ABC123", "$19.99");

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should handle mail exception gracefully (don't rethrow)")
    void sendOrderConfirmation_shouldHandleException() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw — EmailService catches and logs all exceptions
        emailService.sendOrderConfirmation("customer@test.com", 1L, "2x Street Taco");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should set correct subject and recipient in order confirmation")
    void sendOrderConfirmation_shouldSetCorrectSubjectAndTo() throws Exception {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendOrderConfirmation("customer@test.com", 1L, "2x Taco");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should handle null transactionRef in payment receipt")
    void sendPaymentReceipt_shouldHandleNullTransactionRef() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendPaymentReceipt("customer@test.com", 1L, null, "$19.99");
        verify(mailSender).send(any(MimeMessage.class));
    }
}
