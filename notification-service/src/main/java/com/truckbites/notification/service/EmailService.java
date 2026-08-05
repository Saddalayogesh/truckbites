package com.truckbites.notification.service;

import com.truckbites.notification.event.OrderPlacedEvent;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Sends transactional emails (order confirmation, payment receipt) with rich,
 * email-client-safe HTML templates built from structured event data.
 *
 * <p>Brand palette (matches the TruckBites web app): terracotta #B85C38,
 * cream #FCF8F4, linen #F6EEE6, sage green #6F8F5B, ink #232323, body #6E6259,
 * line #E8DDD3.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter DATE_TIME =
            DateTimeFormatter.ofPattern("MMM d, yyyy '·' h:mm a", Locale.ENGLISH);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:truckbites@notifications.local}")
    private String fromAddress;

    /** Base URL of the web frontend, used for CTA links in emails. */
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ---------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------

    /**
     * Sends an order confirmation email to the customer.
     */
    public void sendOrderConfirmation(String to, Long orderId, Long truckId, LocalDateTime createdAt,
                                      BigDecimal totalAmount, List<OrderPlacedEvent.OrderItemEvent> items) {
        log.info("Sending order confirmation email to: {}, orderId: {}", to, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Order #" + orderId + " confirmed – TruckBites");
            helper.setText(
                    buildOrderConfirmationPlainText(orderId, truckId, createdAt, totalAmount, items),
                    buildOrderConfirmationBody(orderId, truckId, createdAt, totalAmount, items));

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
    public void sendPaymentReceipt(String to, Long orderId, String transactionRef, BigDecimal amount,
                                   String method, LocalDateTime createdAt) {
        log.info("Sending payment receipt email to: {}, orderId: {}", to, orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Payment received for order #" + orderId + " – TruckBites");
            helper.setText(
                    buildPaymentReceiptPlainText(orderId, transactionRef, amount, method, createdAt),
                    buildPaymentReceiptBody(orderId, transactionRef, amount, method, createdAt));

            mailSender.send(message);
            log.info("Payment receipt email sent for orderId: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to send payment receipt email for orderId: {}", orderId, e);
            // Don't rethrow — this is a non-critical side-effect
        }
    }

    // ---------------------------------------------------------------------
    // Template rendering
    // ---------------------------------------------------------------------

    private String buildOrderConfirmationBody(Long orderId, Long truckId, LocalDateTime createdAt,
                                              BigDecimal totalAmount, List<OrderPlacedEvent.OrderItemEvent> items) {
        String total = formatInr(totalAmount);
        String trackUrl = frontendUrl + "/orders?orderId=" + orderId;

        String content = ORDER_CONFIRMATION_CONTENT
                .replace("__ORDER_ID__", String.valueOf(orderId))
                .replace("__TOTAL__", total)
                .replace("__DATE__", formatDateTime(createdAt))
                .replace("__TRUCK__", truckId == null ? "Pickup at truck location" : "Truck #" + truckId)
                .replace("__TRACK_URL__", trackUrl)
                .replace("__ITEM_ROWS__", buildItemRows(items))
                .replace("__TOTAL_ROW__", TOTAL_ROW.replace("__TOTAL__", total));

        return render(
                "Order #" + orderId + " confirmed – TruckBites",
                "Your order #" + orderId + " is confirmed — our chefs are preparing it fresh. Total " + total + ".",
                header(BRAND_PRIMARY, "#F6E3D4"),
                content);
    }

    private String buildPaymentReceiptBody(Long orderId, String transactionRef, BigDecimal amount,
                                           String method, LocalDateTime createdAt) {
        String total = formatInr(amount);
        String viewUrl = frontendUrl + "/orders?orderId=" + orderId;

        String content = PAYMENT_RECEIPT_CONTENT
                .replace("__ORDER_ID__", String.valueOf(orderId))
                .replace("__AMOUNT__", total)
                .replace("__RECEIPT_ROWS__", buildReceiptRows(transactionRef, method, createdAt))
                .replace("__VIEW_URL__", viewUrl);

        return render(
                "Payment received for order #" + orderId + " – TruckBites",
                "Payment of " + total + " received for order #" + orderId + ". Thank you for your purchase!",
                header(BRAND_SUCCESS, "#E4EDDE"),
                content);
    }

    /** Wraps header + content in the shared email shell. */
    private String render(String title, String preheader, String header, String content) {
        return SHELL
                .replace("{{TITLE}}", escapeHtml(title))
                .replace("{{PREHEADER}}", escapeHtml(preheader))
                .replace("{{HEADER}}", header)
                .replace("{{CONTENT}}", content)
                .replace("{{FOOTER}}", footer());
    }

    // ---------------------------------------------------------------------
    // Plain-text fallbacks (multipart/alternative — spam-filter friendly)
    // ---------------------------------------------------------------------

    private String buildOrderConfirmationPlainText(Long orderId, Long truckId, LocalDateTime createdAt,
                                                   BigDecimal totalAmount, List<OrderPlacedEvent.OrderItemEvent> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("TruckBites – Fresh food on wheels\n\n");
        sb.append("ORDER CONFIRMED 🎉\n\n");
        sb.append("Hi there — your order #").append(orderId)
                .append(" has been placed and our chefs are already preparing it fresh.\n\n");
        sb.append("Order number: #").append(orderId).append('\n');
        sb.append("Order total: ").append(formatInr(totalAmount)).append('\n');
        sb.append("Placed on: ").append(formatDateTime(createdAt)).append('\n');
        sb.append("Pickup point: ")
                .append(truckId == null ? "Pickup at truck location" : "Truck #" + truckId)
                .append("\n\n");
        sb.append("YOUR ORDER\n");
        if (items != null) {
            for (OrderPlacedEvent.OrderItemEvent item : items) {
                int qty = item.getQuantity() == null ? 0 : item.getQuantity();
                BigDecimal price = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
                String name = item.getItemName() == null || item.getItemName().isBlank()
                        ? "Menu item" : item.getItemName();
                sb.append("- ").append(name).append(" × ").append(qty)
                        .append(" — ").append(formatInr(price.multiply(BigDecimal.valueOf(qty)))).append('\n');
            }
        }
        sb.append("\nTotal: ").append(formatInr(totalAmount)).append("\n\n");
        sb.append("Track your order: ").append(frontendUrl).append("/orders?orderId=").append(orderId).append("\n\n");
        sb.append("Questions? support@truckbites.com");
        return sb.toString();
    }

    private String buildPaymentReceiptPlainText(Long orderId, String transactionRef, BigDecimal amount,
                                                String method, LocalDateTime createdAt) {
        StringBuilder sb = new StringBuilder();
        sb.append("TruckBites – Fresh food on wheels\n\n");
        sb.append("PAYMENT RECEIVED ✅\n\n");
        sb.append("Payment of ").append(formatInr(amount)).append(" received successfully for order #")
                .append(orderId).append(".\n\n");
        sb.append("Receipt #").append(orderId).append('\n');
        sb.append("Transaction reference: ")
                .append(transactionRef == null || transactionRef.isBlank() ? "—" : transactionRef).append('\n');
        sb.append("Payment method: ").append(paymentMethodLabel(method)).append('\n');
        sb.append("Status: Successful\n");
        sb.append("Date: ").append(formatDateTime(createdAt)).append("\n\n");
        sb.append("View your order: ").append(frontendUrl).append("/orders?orderId=").append(orderId).append("\n\n");
        sb.append("Need a copy of this receipt or help with your order? support@truckbites.com");
        return sb.toString();
    }

    /** Brand footer band (copyright year derived so it never goes stale). */
    private String footer() {
        return """
                <tr>
                  <td style="background-color:#FCF8F4; border-top:1px solid #E8DDD3; padding:26px 32px; text-align:center;">
                    <p style="margin:0 0 8px; font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:15px; font-weight:700; color:#232323;">🚚 TruckBites</p>
                    <p style="margin:0 0 14px; font-family:Arial, sans-serif; font-size:12px; color:#6E6259;">Fresh food on wheels — discover your next favourite bite.</p>
                    <p style="margin:0; font-family:Arial, sans-serif; font-size:11px; color:#9A8F84;">© __YEAR__ TruckBites · All rights reserved</p>
                  </td>
                </tr>
                """.replace("__YEAR__", String.valueOf(Year.now().getValue()));
    }

    /** Brand header band with wordmark, truck icon and tagline. */
    private String header(String bgColor, String accentColor) {
        return HEADER
                .replace("__BG__", bgColor)
                .replace("__ACCENT__", accentColor);
    }

    /** Itemized rows for the order table. */
    private String buildItemRows(List<OrderPlacedEvent.OrderItemEvent> items) {
        if (items == null || items.isEmpty()) {
            return "      <tr><td colspan=\"3\" style=\"padding:14px 16px; font-family:Arial, sans-serif; font-size:13px; color:#6E6259;\">No items listed.</td></tr>\n";
        }
        StringBuilder rows = new StringBuilder();
        for (OrderPlacedEvent.OrderItemEvent item : items) {
            int qty = item.getQuantity() == null ? 0 : item.getQuantity();
            BigDecimal price = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
            String name = item.getItemName() == null || item.getItemName().isBlank()
                    ? "Menu item" : escapeHtml(item.getItemName());
            rows.append(ITEM_ROW
                    .replace("__NAME__", name)
                    .replace("__QTY__", String.valueOf(qty))
                    .replace("__AMOUNT__", formatInr(price.multiply(BigDecimal.valueOf(qty)))));
        }
        return rows.toString();
    }

    /** Detail rows for the payment receipt card. */
    private String buildReceiptRows(String transactionRef, String method, LocalDateTime createdAt) {
        return receiptRow("Transaction reference",
                transactionRef == null || transactionRef.isBlank() ? "—" : transactionRef)
                + receiptRow("Payment method", paymentMethodLabel(method))
                + receiptRow("Status", "Successful ✓")
                + receiptRow("Date", formatDateTime(createdAt));
    }

    private String receiptRow(String label, String value) {
        return "      <tr>\n"
                + "        <td style=\"padding:9px 0; font-family:Arial, sans-serif; font-size:13px; color:#6E6259;\">" + escapeHtml(label) + "</td>\n"
                + "        <td align=\"right\" style=\"padding:9px 0; font-family:Arial, sans-serif; font-size:13px; font-weight:600; color:#232323;\">" + escapeHtml(value) + "</td>\n"
                + "      </tr>\n";
    }

    // ---------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------

    /** Formats a value as Indian Rupees with Indian digit grouping, e.g. ₹1,23,456.78. */
    private String formatInr(BigDecimal value) {
        if (value == null) {
            value = BigDecimal.ZERO;
        }
        return NumberFormat.getCurrencyInstance(new Locale("en", "IN")).format(value);
    }

    private String formatDateTime(LocalDateTime when) {
        return when == null ? "—" : DATE_TIME.format(when);
    }

    private String paymentMethodLabel(String method) {
        if (method == null || method.isBlank()) {
            return "Online payment";
        }
        return switch (method.toUpperCase()) {
            case "RAZORPAY" -> "Razorpay (UPI / Cards / Net Banking)";
            case "UPI" -> "UPI";
            case "CARD", "CREDIT_CARD", "DEBIT_CARD" -> "Card";
            case "NETBANKING", "NET_BANKING" -> "Net Banking";
            case "WALLET" -> "Wallet";
            default -> method;
        };
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // ---------------------------------------------------------------------
    // HTML templates (email-client-safe: tables + inline styles, tokens)
    // ---------------------------------------------------------------------

    private static final String BRAND_PRIMARY = "#B85C38";
    private static final String BRAND_SUCCESS = "#6F8F5B";

    private static final String SHELL = """
            <!DOCTYPE html>
            <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="color-scheme" content="light">
              <meta name="supported-color-schemes" content="light">
              <title>{{TITLE}}</title>
              <style>
                @media only screen and (max-width: 620px) {
                  .container { width: 100% !important; }
                  .pad { padding-left: 20px !important; padding-right: 20px !important; }
                  .btn { width: 100% !important; box-sizing: border-box !important; }
                }
              </style>
            </head>
            <body style="margin:0; padding:0; background-color:#F6EEE6; word-spacing:normal;">
              <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">{{PREHEADER}}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6EEE6;">
                <tr>
                  <td align="center" style="padding:32px 12px;">
                    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(35,35,35,0.08);">
                      {{HEADER}}
                      {{CONTENT}}
                      {{FOOTER}}
                    </table>
                    <p style="margin:20px 0 0; font-family:Arial, sans-serif; font-size:11px; line-height:1.7; color:#9A8F84; text-align:center;">
                      You're receiving this email because you placed an order with TruckBites.<br>
                      Questions? <a href="mailto:support@truckbites.com" style="color:#B85C38; text-decoration:underline;">support@truckbites.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

    private static final String HEADER = """
            <tr>
              <td style="background-color:__BG__; padding:30px 32px 26px 32px; text-align:center;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="font-size:32px; line-height:32px;">🚚</td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:24px; font-weight:700; color:#FFFFFF; letter-spacing:1px; padding-top:8px;">
                      Truck<span style="color:__ACCENT__;">Bites</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:__ACCENT__; padding-top:6px;">
                      Fresh food on wheels
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """;

    private static final String ORDER_CONFIRMATION_CONTENT = """
            <tr>
              <td class="pad" style="padding:36px 40px 32px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <span style="display:inline-block; background-color:#F6EEE6; color:#9E4A2B; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:8px 18px; border-radius:999px;">🎉 &nbsp;Order confirmed</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:26px; font-weight:700; color:#232323; padding:20px 0 8px;">
                      Your food is on the way!
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Arial, sans-serif; font-size:15px; line-height:1.7; color:#6E6259; padding:0 8px;">
                      Hi there — your order <strong style="color:#232323;">#__ORDER_ID__</strong> has been placed successfully and our chefs are already preparing it fresh for you. We'll send your payment receipt in a moment.
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FCF8F4; border:1px solid #E8DDD3; border-radius:14px; margin-top:28px;">
                  <tr>
                    <td style="padding:18px 22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6E6259;">Order number</td>
                          <td align="right" style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6E6259;">Order total</td>
                        </tr>
                        <tr>
                          <td style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:22px; font-weight:700; color:#232323; padding-top:4px;">#__ORDER_ID__</td>
                          <td align="right" style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:22px; font-weight:700; color:#B85C38; padding-top:4px;">__TOTAL__</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="border-top:1px dashed #E8DDD3; font-size:1px; line-height:1px; height:14px;">&nbsp;</td>
                        </tr>
                        <tr>
                          <td style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6E6259;">Placed on</td>
                          <td align="right" style="font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6E6259;">Pickup point</td>
                        </tr>
                        <tr>
                          <td style="font-family:Arial, sans-serif; font-size:14px; font-weight:600; color:#232323; padding-top:4px;">__DATE__</td>
                          <td align="right" style="font-family:Arial, sans-serif; font-size:14px; font-weight:600; color:#232323; padding-top:4px;">__TRUCK__</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="font-family:Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#6E6259; margin:28px 0 12px;">Your order</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E8DDD3; border-radius:14px;">
                  <tr>
                    <td style="background-color:#FCF8F4; padding:10px 16px; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9A8F84; border-bottom:1px solid #E8DDD3;">Item</td>
                    <td align="center" style="background-color:#FCF8F4; padding:10px 16px; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9A8F84; border-bottom:1px solid #E8DDD3;">Qty</td>
                    <td align="right" style="background-color:#FCF8F4; padding:10px 16px; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9A8F84; border-bottom:1px solid #E8DDD3;">Amount</td>
                  </tr>
                  __ITEM_ROWS__
                  __TOTAL_ROW__
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td align="center">
                      <a href="__TRACK_URL__" class="btn" style="display:inline-block; background-color:#B85C38; color:#FFFFFF; font-family:Arial, sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:15px 42px; border-radius:999px; box-shadow:0 6px 16px rgba(184,92,56,0.35);">Track your order →</a>
                    </td>
                  </tr>
                </table>
                <p style="font-family:Arial, sans-serif; font-size:12px; color:#6E6259; text-align:center; margin:16px 0 0;">Prefer pickup? Show this email at the truck to collect your order faster.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="border-top:1px solid #E8DDD3; padding-top:20px; text-align:center; font-family:Arial, sans-serif; font-size:12px; line-height:1.7; color:#6E6259;">
                      Questions about your order?<br>
                      <a href="mailto:support@truckbites.com" style="color:#B85C38; font-weight:600; text-decoration:none;">support@truckbites.com</a> — we're happy to help.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """;

    private static final String ITEM_ROW = """
            <tr>
              <td style="padding:12px 16px; border-bottom:1px solid #E8DDD3; font-family:Arial, sans-serif; font-size:14px; font-weight:600; color:#232323;">__NAME__</td>
              <td align="center" style="padding:12px 16px; border-bottom:1px solid #E8DDD3; font-family:Arial, sans-serif; font-size:14px; color:#6E6259;">__QTY__</td>
              <td align="right" style="padding:12px 16px; border-bottom:1px solid #E8DDD3; font-family:Arial, sans-serif; font-size:14px; font-weight:600; color:#232323;">__AMOUNT__</td>
            </tr>
            """;

    private static final String TOTAL_ROW = """
            <tr>
              <td colspan="2" align="right" style="padding:14px 16px; background-color:#FCF8F4; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#6E6259; border-top:1px solid #E8DDD3;">Total</td>
              <td align="right" style="padding:14px 16px; background-color:#FCF8F4; font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:700; color:#B85C38; border-top:1px solid #E8DDD3;">__TOTAL__</td>
            </tr>
            """;

    private static final String PAYMENT_RECEIPT_CONTENT = """
            <tr>
              <td class="pad" style="padding:36px 40px 32px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <span style="display:inline-block; background-color:#F6EEE6; color:#4F6B3F; font-family:Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:8px 18px; border-radius:999px;">✅ &nbsp;Payment received</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:26px; font-weight:700; color:#232323; padding:20px 0 4px;">
                      Payment successful
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Poppins, 'Segoe UI', Arial, sans-serif; font-size:38px; font-weight:700; color:#6F8F5B; padding:6px 0;">
                      __AMOUNT__
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family:Arial, sans-serif; font-size:15px; line-height:1.7; color:#6E6259; padding:4px 8px 0;">
                      We've received your payment of <strong style="color:#232323;">__AMOUNT__</strong> for order <strong style="color:#232323;">#__ORDER_ID__</strong>. Your food is being prepared — sit back and enjoy!
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FCF8F4; border:1px solid #E8DDD3; border-radius:14px; margin-top:28px;">
                  <tr>
                    <td style="padding:18px 22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:9px 0; font-family:Arial, sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6E6259; border-bottom:1px solid #E8DDD3;">Receipt</td>
                          <td align="right" style="padding:9px 0; font-family:Arial, sans-serif; font-size:12px; font-weight:700; color:#232323; border-bottom:1px solid #E8DDD3;">#__ORDER_ID__</td>
                        </tr>
                        __RECEIPT_ROWS__
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td align="center">
                      <a href="__VIEW_URL__" class="btn" style="display:inline-block; background-color:#4F6B3F; color:#FFFFFF; font-family:Arial, sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:15px 42px; border-radius:999px; box-shadow:0 6px 16px rgba(79,107,63,0.35);">View your order →</a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="border-top:1px solid #E8DDD3; padding-top:20px; text-align:center; font-family:Arial, sans-serif; font-size:12px; line-height:1.7; color:#6E6259;">
                      Need a copy of this receipt or help with your order?<br>
                      <a href="mailto:support@truckbites.com" style="color:#4F6B3F; font-weight:600; text-decoration:none;">support@truckbites.com</a> — we're happy to help.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """;
}
