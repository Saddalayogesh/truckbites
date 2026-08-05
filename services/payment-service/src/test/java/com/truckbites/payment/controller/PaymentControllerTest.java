package com.truckbites.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.truckbites.payment.dto.CreateRazorpayOrderRequest;
import com.truckbites.payment.dto.PaymentResponse;
import com.truckbites.payment.dto.RazorpayOrderResponse;
import com.truckbites.payment.dto.VerifyRazorpayPaymentRequest;
import com.truckbites.payment.model.PaymentStatus;
import com.truckbites.payment.service.PaymentService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = "jwt.secret=b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisplayName("PaymentController Integration Tests")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @MockitoBean
    private PaymentService paymentService;

    private String validToken;
    private PaymentResponse successResponse;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
        validToken = createValidJwt("test@truckbites.com", "CUSTOMER");

        successResponse = PaymentResponse.builder()
                .id(1L)
                .orderId(1L)
                .amount(BigDecimal.valueOf(25.00))
                .status(PaymentStatus.SUCCESS)
                .method("RAZORPAY")
                .transactionRef("pay_A1B2C3D4")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String createValidJwt(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("userId", 1L)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Nested
    @DisplayName("POST /api/payments/razorpay/order")
    class CreateRazorpayOrder {

        @Test
        @DisplayName("should return 200 with razorpay order details")
        void shouldReturn200WithOrderDetails() throws Exception {
            // Given
            CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(499.00));
            request.setCurrency("INR");

            RazorpayOrderResponse orderResponse = RazorpayOrderResponse.builder()
                    .orderId(1L)
                    .razorpayOrderId("order_ABC123")
                    .amount(BigDecimal.valueOf(499.00))
                    .currency("INR")
                    .keyId("rzp_test_key")
                    .build();

            when(paymentService.createRazorpayOrder(any(CreateRazorpayOrderRequest.class)))
                    .thenReturn(orderResponse);

            // When & Then
            mockMvc.perform(post("/api/payments/razorpay/order")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId", is(1)))
                    .andExpect(jsonPath("$.razorpayOrderId", is("order_ABC123")))
                    .andExpect(jsonPath("$.amount", is(499.00)))
                    .andExpect(jsonPath("$.currency", is("INR")))
                    .andExpect(jsonPath("$.keyId", is("rzp_test_key")));
        }

        @Test
        @DisplayName("should return 401 when no auth token provided")
        void shouldReturn401WhenNoAuth() throws Exception {
            // Given
            CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(499.00));

            // When & Then — no Authorization header
            mockMvc.perform(post("/api/payments/razorpay/order")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 when amount is null")
        void shouldReturn400WhenAmountIsNull() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "orderId": 1
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments/razorpay/order")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/payments/razorpay/verify")
    class VerifyRazorpayPayment {

        @Test
        @DisplayName("should return 201 and payment response on successful verification")
        void shouldReturn201OnSuccessfulVerification() throws Exception {
            // Given
            VerifyRazorpayPaymentRequest request = new VerifyRazorpayPaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(499.00));
            request.setRazorpayOrderId("order_ABC123");
            request.setRazorpayPaymentId("pay_DEF456");
            request.setRazorpaySignature("signature123");

            when(paymentService.verifyAndRecordPayment(any(VerifyRazorpayPaymentRequest.class)))
                    .thenReturn(successResponse);

            // When & Then
            mockMvc.perform(post("/api/payments/razorpay/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(1)))
                    .andExpect(jsonPath("$.orderId", is(1)))
                    .andExpect(jsonPath("$.status", is("SUCCESS")))
                    .andExpect(jsonPath("$.method", is("RAZORPAY")))
                    .andExpect(jsonPath("$.transactionRef", is("pay_A1B2C3D4")));
        }

        @Test
        @DisplayName("should return 401 when no auth token provided")
        void shouldReturn401WhenNoAuth() throws Exception {
            // Given
            VerifyRazorpayPaymentRequest request = new VerifyRazorpayPaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(499.00));
            request.setRazorpayOrderId("order_ABC123");
            request.setRazorpayPaymentId("pay_DEF456");
            request.setRazorpaySignature("signature123");

            // When & Then — no Authorization header
            mockMvc.perform(post("/api/payments/razorpay/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 when razorpaySignature is missing")
        void shouldReturn400WhenSignatureMissing() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "orderId": 1,
                        "amount": 499.00,
                        "razorpayOrderId": "order_ABC123",
                        "razorpayPaymentId": "pay_DEF456"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments/razorpay/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when razorpayPaymentId is missing")
        void shouldReturn400WhenPaymentIdMissing() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "orderId": 1,
                        "amount": 499.00,
                        "razorpayOrderId": "order_ABC123",
                        "razorpaySignature": "signature123"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments/razorpay/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/payments/order/{orderId}")
    class GetPaymentsByOrder {

        @Test
        @DisplayName("should return 200 with list of payments")
        void shouldReturn200WithPaymentList() throws Exception {
            // Given
            Long orderId = 1L;
            when(paymentService.getPaymentsByOrderId(orderId))
                    .thenReturn(List.of(successResponse));

            // When & Then
            mockMvc.perform(get("/api/payments/order/{orderId}", orderId)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(1)))
                    .andExpect(jsonPath("$[0].orderId", is(1)))
                    .andExpect(jsonPath("$[0].status", is("SUCCESS")));
        }

        @Test
        @DisplayName("should return 200 with empty list when no payments found")
        void shouldReturn200WithEmptyList() throws Exception {
            // Given
            Long orderId = 999L;
            when(paymentService.getPaymentsByOrderId(orderId))
                    .thenReturn(List.of());

            // When & Then
            mockMvc.perform(get("/api/payments/order/{orderId}", orderId)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("should return 500 when orderId is not a number")
        void shouldReturn500WhenOrderIdNotNumeric() throws Exception {
            // When & Then — invalid type for path variable causes 500
            mockMvc.perform(get("/api/payments/order/{orderId}", "invalid")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().is5xxServerError());
        }
    }
}
