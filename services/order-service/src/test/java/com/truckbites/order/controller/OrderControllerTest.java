package com.truckbites.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truckbites.order.dto.CreateOrderRequest;
import com.truckbites.order.dto.OrderResponse;
import com.truckbites.order.dto.OrderStatusUpdateRequest;
import com.truckbites.order.model.OrderStatus;
import com.truckbites.order.service.OrderService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.security.Key;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "jwt.secret=b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0")
@AutoConfigureMockMvc
class OrderControllerTest {

    private static final String TEST_SECRET = "b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OrderService orderService;

    private String customerToken;
    private String vendorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        customerToken = createToken("customer@test.com", "CUSTOMER");
        vendorToken = createToken("vendor@test.com", "VENDOR");
        adminToken = createToken("admin@test.com", "ADMIN");
    }

    private String createToken(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
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

    @Test
    @DisplayName("POST /api/orders should place order for CUSTOMER")
    void placeOrder_shouldReturn201() throws Exception {
        String requestJson = """
                {
                    "customerEmail": "customer@example.com",
                    "truckId": 1,
                    "items": [{"menuItemId": 1, "quantity": 2}]
                }
                """;

        OrderResponse mockResponse = OrderResponse.builder()
                .id(1L)
                .customerId(1L)
                .truckId(1L)
                .totalAmount(BigDecimal.valueOf(7.98))
                .status(OrderStatus.PLACED)
                .items(List.of())
                .build();

        when(orderService.placeOrder(anyLong(), any(CreateOrderRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/orders should return 403 without auth")
    void placeOrder_shouldReturn403WithoutAuth() throws Exception {
        String requestJson = """
                {"customerEmail": "c@e.com", "truckId": 1, "items": [{"menuItemId": 1, "quantity": 1}]}
                """;
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/orders/{id} should return order")
    void getOrder_shouldReturn200() throws Exception {
        OrderResponse mockResponse = OrderResponse.builder()
                .id(1L).customerId(1L).truckId(1L)
                .totalAmount(BigDecimal.TEN).status(OrderStatus.PLACED)
                .items(List.of()).build();

        when(orderService.getOrderById(1L)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/orders/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/orders/my-orders should return customer orders")
    void getMyOrders_shouldReturn200() throws Exception {
        when(orderService.getOrdersByCustomer(anyLong())).thenReturn(List.of());
        mockMvc.perform(get("/api/orders/my-orders")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/orders/truck/{truckId} should return truck orders")
    void getOrdersByTruck_shouldReturn200() throws Exception {
        when(orderService.getOrdersByTruck(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/orders/truck/1")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/orders/truck/{truckId}/status should filter by status")
    void getOrdersByTruckAndStatus_shouldReturn200() throws Exception {
        when(orderService.getOrdersByTruckAndStatus(1L, OrderStatus.PLACED)).thenReturn(List.of());
        mockMvc.perform(get("/api/orders/truck/1/status?status=PLACED")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/orders/{id}/status should update for VENDOR")
    void updateOrderStatus_shouldReturn200() throws Exception {
        String body = "{\"status\": \"PREPARING\"}";
        OrderResponse mockResponse = OrderResponse.builder()
                .id(1L).customerId(1L).truckId(1L)
                .totalAmount(BigDecimal.TEN).status(OrderStatus.PREPARING)
                .items(List.of()).build();

        when(orderService.updateOrderStatus(anyLong(), any(OrderStatusUpdateRequest.class), anyLong()))
                .thenReturn(mockResponse);

        mockMvc.perform(patch("/api/orders/1/status")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));
    }

    @Test
    @DisplayName("PATCH /api/orders/{id}/status should return 403 for CUSTOMER")
    void updateOrderStatus_shouldReturn403ForCustomer() throws Exception {
        mockMvc.perform(patch("/api/orders/1/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"PREPARING\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/orders/all should return all orders for ADMIN")
    void getAllOrdersAdmin_shouldReturn200() throws Exception {
        when(orderService.getAllOrders()).thenReturn(List.of());
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/orders/all should return 403 for non-ADMIN")
    void getAllOrdersAdmin_shouldReturn403ForVendor() throws Exception {
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isForbidden());
    }
}
