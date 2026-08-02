package com.truckbites.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.truckbites.payment.dto.PaymentRequest;
import com.truckbites.payment.dto.PaymentResponse;
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
                .method("CARD")
                .transactionRef("TXN-A1B2C3D4")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String createValidJwt(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Nested
    @DisplayName("POST /api/payments")
    class ProcessPayment {

        @Test
        @DisplayName("should return 201 and payment response on successful payment")
        void shouldReturn201OnSuccessfulPayment() throws Exception {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(25.00));
            request.setMethod("CARD");

            when(paymentService.processPayment(any(PaymentRequest.class)))
                    .thenReturn(successResponse);

            // When & Then
            mockMvc.perform(post("/api/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(1)))
                    .andExpect(jsonPath("$.orderId", is(1)))
                    .andExpect(jsonPath("$.amount", is(25.00)))
                    .andExpect(jsonPath("$.status", is("SUCCESS")))
                    .andExpect(jsonPath("$.method", is("CARD")))
                    .andExpect(jsonPath("$.transactionRef", is("TXN-A1B2C3D4")));
        }

        @Test
        @DisplayName("should return 401 when no auth token provided")
        void shouldReturn401WhenNoAuth() throws Exception {
            // Given
            PaymentRequest request = new PaymentRequest();
            request.setOrderId(1L);
            request.setAmount(BigDecimal.valueOf(25.00));
            request.setMethod("CARD");

            // When & Then — no Authorization header
            mockMvc.perform(post("/api/payments")
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
                        "orderId": 1,
                        "method": "CARD"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when orderId is null")
        void shouldReturn400WhenOrderIdIsNull() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "amount": 25.00,
                        "method": "CARD"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when amount is negative")
        void shouldReturn400WhenAmountIsNegative() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "orderId": 1,
                        "amount": -10.00,
                        "method": "CARD"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest)
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when method is null")
        void shouldReturn400WhenMethodIsNull() throws Exception {
            // Given
            String invalidRequest = """
                    {
                        "orderId": 1,
                        "amount": 25.00
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/payments")
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
