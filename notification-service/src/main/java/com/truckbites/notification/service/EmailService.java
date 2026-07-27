package com.truckbites.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:truckbites@notifications.local}")
    private String fromAddress;

    /**
     * Sends an order confirmation email to the customer.
     */
    public void sendOrderConfirmation(String to, Long orderId, String summary) {
        log.info("Sending order confirmation email to: {}, orderId: {}", to, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Order #" + orderId + " Confirmed – TruckBites");
            helper.setText(buildOrderConfirmationBody(orderId, summary), true);

            mailSender.send(message);
            log.info("Order confirmation email sent for orderId: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for orderId: {}", orderId, e);
            // Don't rethrow — this is a non-critical side-effect
        }
    }

    /**
     * Sends a payment receipt email to the customer.
     */
    public void sendPaymentReceipt(String to, Long orderId, String transactionRef, String amount) {
        log.info("Sending payment receipt email to: {}, orderId: {}", to, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Payment Received – Order #" + orderId + " – TruckBites");
            helper.setText(buildPaymentReceiptBody(orderId, transactionRef, amount), true);

            mailSender.send(message);
            log.info("Payment receipt email sent for orderId: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to send payment receipt email for orderId: {}", orderId, e);
            // Don't rethrow — this is a non-critical side-effect
        }
    }

    private String buildOrderConfirmationBody(Long orderId, String summary) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background-color: #f97316; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TruckBites</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #333333; margin-top: 0;">Order Confirmed!</h2>
                            <p style="color: #555555; font-size: 16px;">Your order <strong>#%d</strong> has been placed and is being prepared.</p>
                            <div style="background-color: #f9fafb; border-left: 4px solid #f97316; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                                <pre style="font-family: Arial, sans-serif; color: #333333; margin: 0; white-space: pre-wrap;">%s</pre>
                            </div>
                            <p style="color: #888888; font-size: 14px;">Thank you for choosing TruckBites!</p>
                        </div>
                        <div style="background-color: #f4f4f4; padding: 12px 24px; text-align: center; font-size: 12px; color: #999999;">
                            <p style="margin: 0;">TruckBites – Fresh food on wheels</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(orderId, summary != null ? summary : "");
    }

    private String buildPaymentReceiptBody(Long orderId, String transactionRef, String amount) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background-color: #22c55e; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TruckBites</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #333333; margin-top: 0;">Payment Received!</h2>
                            <p style="color: #555555; font-size: 16px;">Your payment of <strong>%s</strong> for order <strong>#%d</strong> was successful.</p>
                            <div style="background-color: #f9fafb; border-left: 4px solid #22c55e; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                                <p style="margin: 4px 0; color: #555555;"><strong>Transaction Ref:</strong> %s</p>
                                <p style="margin: 4px 0; color: #555555;"><strong>Amount:</strong> %s</p>
                            </div>
                            <p style="color: #888888; font-size: 14px;">Your food is on its way. Enjoy!</p>
                        </div>
                        <div style="background-color: #f4f4f4; padding: 12px 24px; text-align: center; font-size: 12px; color: #999999;">
                            <p style="margin: 0;">TruckBites – Fresh food on wheels</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(amount, orderId, transactionRef != null ? transactionRef : "N/A", amount);
    }
}
