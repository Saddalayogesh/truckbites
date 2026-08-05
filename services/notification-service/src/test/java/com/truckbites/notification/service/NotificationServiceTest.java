package com.truckbites.notification.service;

import com.truckbites.notification.event.OrderPlacedEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;

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

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 8, 5, 16, 12);

    private void configureMocks() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));
    }

    /** Extracts the text/html body from a MimeMessage, recursing into multiparts. */
    private static String extractHtmlBody(MimeMessage message) throws Exception {
        return extractHtmlBody(message.getContent());
    }

    private static String extractHtmlBody(Object content) throws Exception {
        if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                if (part.isMimeType("text/html")) {
                    return (String) part.getContent();
                }
                Object partContent = part.getContent();
                // Unsaved in-memory parts report text/plain; detect HTML by content.
                if (partContent instanceof String s && s.trim().startsWith("<!DOCTYPE")) {
                    return s;
                }
                String nested = extractHtmlBody(partContent);
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }

    /** Extracts the text/plain fallback part of a multipart/alternative message. */
    private static String extractPlainTextBody(MimeMessage message) throws Exception {
        return extractPlainTextBody(message.getContent());
    }

    private static String extractPlainTextBody(Object content) throws Exception {
        if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                Object partContent = multipart.getBodyPart(i).getContent();
                if (partContent instanceof String s && !s.trim().startsWith("<!DOCTYPE")) {
                    return s;
                }
                String nested = extractPlainTextBody(partContent);
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }

    private static List<OrderPlacedEvent.OrderItemEvent> sampleItems() {
        return List.of(
                OrderPlacedEvent.OrderItemEvent.builder()
                        .menuItemId(1L).itemName("Ghee Roast").price(new BigDecimal("169.00")).quantity(2).build(),
                OrderPlacedEvent.OrderItemEvent.builder()
                        .menuItemId(2L).itemName("Mysore Dosa").price(new BigDecimal("149.00")).quantity(1).build());
    }

    @Test
    @DisplayName("Should send order confirmation email without throwing")
    void sendOrderConfirmation_shouldNotThrow() {
        configureMocks();

        emailService.sendOrderConfirmation("customer@test.com", 21L, 7L, CREATED_AT,
                new BigDecimal("529.05"), sampleItems());

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send payment receipt email without throwing")
    void sendPaymentReceipt_shouldNotThrow() {
        configureMocks();

        emailService.sendPaymentReceipt("customer@test.com", 21L, "pay_MockRef123", new BigDecimal("529.05"),
                "RAZORPAY", CREATED_AT);

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should handle mail exception gracefully (don't rethrow)")
    void sendOrderConfirmation_shouldHandleException() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw — EmailService catches and logs all exceptions
        emailService.sendOrderConfirmation("customer@test.com", 21L, 7L, CREATED_AT,
                new BigDecimal("529.05"), sampleItems());
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Order confirmation email renders INR totals, item rows and CTA")
    void sendOrderConfirmation_rendersRichInrHtml() throws Exception {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");

        MimeMessage real = new MimeMessage(Session.getDefaultInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(real);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendOrderConfirmation("customer@test.com", 21L, 7L, CREATED_AT,
                new BigDecimal("529.05"), sampleItems());

        String body = extractHtmlBody(real);
        assertThat(body)
                .contains("Order #21 confirmed")
                .contains(">#21<")
                .contains("₹338.00")   // Ghee Roast × 2
                .contains("₹149.00")   // Mysore Dosa × 1
                .contains("₹529.05")   // order total
                .contains("Ghee Roast")
                .contains("Mysore Dosa")
                .contains("Track your order")
                .contains("http://localhost:5173/orders?orderId=21");

        String plain = extractPlainTextBody(real);
        assertThat(plain)
                .contains("₹529.05")
                .contains("Ghee Roast × 2 — ₹338.00")
                .contains("Track your order: http://localhost:5173/orders?orderId=21");
    }

    @Test
    @DisplayName("Payment receipt email renders INR amount, ref and method")
    void sendPaymentReceipt_rendersReceiptHtml() throws Exception {
        ReflectionTestUtils.setField(emailService, "fromAddress", "truckbites@test.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");

        MimeMessage real = new MimeMessage(Session.getDefaultInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(real);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        emailService.sendPaymentReceipt("customer@test.com", 21L, "pay_MockRef123", new BigDecimal("529.05"),
                "RAZORPAY", CREATED_AT);

        String body = extractHtmlBody(real);
        assertThat(body)
                .contains("Payment received for order #21")
                .contains("₹529.05")
                .contains("pay_MockRef123")
                .contains("Razorpay (UPI / Cards / Net Banking)")
                .contains("Successful ✓")
                .contains("View your order")
                .contains("http://localhost:5173/orders?orderId=21");

        String plain = extractPlainTextBody(real);
        assertThat(plain)
                .contains("₹529.05")
                .contains("pay_MockRef123")
                .contains("Status: Successful");
    }

    @Test
    @DisplayName("Should handle null transactionRef in payment receipt")
    void sendPaymentReceipt_shouldHandleNullTransactionRef() {
        configureMocks();

        emailService.sendPaymentReceipt("customer@test.com", 21L, null, new BigDecimal("529.05"),
                "RAZORPAY", CREATED_AT);
        verify(mailSender).send(any(MimeMessage.class));
    }
}
