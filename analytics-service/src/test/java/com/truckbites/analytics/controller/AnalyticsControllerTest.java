package com.truckbites.analytics.controller;

import com.truckbites.analytics.dto.DailySalesResponse;
import com.truckbites.analytics.dto.OrderStatusSummaryResponse;
import com.truckbites.analytics.dto.TopSellingItemResponse;
import com.truckbites.analytics.service.AnalyticsService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.security.Key;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "jwt.secret=b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0")
@AutoConfigureMockMvc
class AnalyticsControllerTest {

    private static final String TEST_SECRET = "b7d3f9c1e8a24b5d6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    private String vendorToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        vendorToken = createToken("vendor@test.com", "VENDOR");
        customerToken = createToken("customer@test.com", "CUSTOMER");
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
    @DisplayName("GET /api/analytics/truck/{truckId}/sales should return sales for VENDOR")
    void getDailySales_shouldReturn200ForVendor() throws Exception {
        List<DailySalesResponse> mockSales = List.of(
                DailySalesResponse.builder().date(LocalDate.now()).totalSales(BigDecimal.valueOf(245.50)).build()
        );
        when(analyticsService.getDailySales(anyLong(), anyLong())).thenReturn(mockSales);

        mockMvc.perform(get("/api/analytics/truck/1/sales")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].totalSales").value(245.50));
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/sales should return 403 for CUSTOMER")
    void getDailySales_shouldReturn403ForCustomer() throws Exception {
        mockMvc.perform(get("/api/analytics/truck/1/sales")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/sales should return 403 without auth")
    void getDailySales_shouldReturn403WithoutAuth() throws Exception {
        mockMvc.perform(get("/api/analytics/truck/1/sales"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/top-items should return items for VENDOR")
    void getTopSellingItems_shouldReturn200ForVendor() throws Exception {
        List<TopSellingItemResponse> mockItems = List.of(
                TopSellingItemResponse.builder().itemName("Street Taco").totalQuantity(47L).totalRevenue(BigDecimal.valueOf(187.53)).build()
        );
        when(analyticsService.getTopSellingItems(anyLong(), anyLong())).thenReturn(mockItems);

        mockMvc.perform(get("/api/analytics/truck/1/top-items")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("Street Taco"));
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/top-items should return 403 for CUSTOMER")
    void getTopSellingItems_shouldReturn403ForCustomer() throws Exception {
        mockMvc.perform(get("/api/analytics/truck/1/top-items")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/order-summary should return summary for VENDOR")
    void getOrderStatusSummary_shouldReturn200ForVendor() throws Exception {
        List<OrderStatusSummaryResponse> mockSummary = List.of(
                OrderStatusSummaryResponse.builder().status("PLACED").count(5L).build()
        );
        when(analyticsService.getOrderCountByStatus(anyLong(), anyLong())).thenReturn(mockSummary);

        mockMvc.perform(get("/api/analytics/truck/1/order-summary")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PLACED"));
    }

    @Test
    @DisplayName("GET /api/analytics/truck/{truckId}/order-summary should return 403 for CUSTOMER")
    void getOrderStatusSummary_shouldReturn403ForCustomer() throws Exception {
        mockMvc.perform(get("/api/analytics/truck/1/order-summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }
}
