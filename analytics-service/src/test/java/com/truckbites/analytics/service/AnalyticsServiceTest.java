package com.truckbites.analytics.service;

import com.truckbites.analytics.client.TruckDto;
import com.truckbites.analytics.client.TruckServiceClient;
import com.truckbites.analytics.dto.DailySalesResponse;
import com.truckbites.analytics.dto.OrderStatusSummaryResponse;
import com.truckbites.analytics.dto.TopSellingItemResponse;
import com.truckbites.analytics.repository.AnalyticsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AnalyticsRepository analyticsRepository;
    @Mock
    private TruckServiceClient truckServiceClient;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(analyticsRepository, truckServiceClient);
    }

    private TruckDto createTruckDto(Long id, Long ownerId) {
        TruckDto dto = new TruckDto();
        dto.setId(id);
        dto.setOwnerId(ownerId);
        return dto;
    }

    @Test
    @DisplayName("Should return daily sales when owner matches")
    void getDailySales_shouldReturnSales_whenOwnerMatches() {
        when(truckServiceClient.getTruckById(1L)).thenReturn(createTruckDto(1L, 42L));
        List<DailySalesResponse> mockSales = List.of(
                DailySalesResponse.builder().date(LocalDate.now()).totalSales(BigDecimal.valueOf(100)).build()
        );
        when(analyticsRepository.findDailySales(1L)).thenReturn(mockSales);

        List<DailySalesResponse> result = analyticsService.getDailySales(1L, 42L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTotalSales()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    @DisplayName("Should throw SecurityException when owner does not match")
    void getDailySales_shouldThrow_whenNotOwner() {
        when(truckServiceClient.getTruckById(1L)).thenReturn(createTruckDto(1L, 99L));
        assertThatThrownBy(() -> analyticsService.getDailySales(1L, 42L))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("do not own");
    }

    @Test
    @DisplayName("Should return top selling items")
    void getTopSellingItems_shouldReturnItems() {
        when(truckServiceClient.getTruckById(1L)).thenReturn(createTruckDto(1L, 42L));
        List<TopSellingItemResponse> mockItems = List.of(
                TopSellingItemResponse.builder().itemName("Taco").totalQuantity(10L).totalRevenue(BigDecimal.valueOf(39.90)).build()
        );
        when(analyticsRepository.findTopSellingItems(1L)).thenReturn(mockItems);

        List<TopSellingItemResponse> result = analyticsService.getTopSellingItems(1L, 42L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemName()).isEqualTo("Taco");
    }

    @Test
    @DisplayName("Should return order count by status")
    void getOrderCountByStatus_shouldReturnCounts() {
        when(truckServiceClient.getTruckById(1L)).thenReturn(createTruckDto(1L, 42L));
        List<OrderStatusSummaryResponse> mockSummary = List.of(
                OrderStatusSummaryResponse.builder().status("PLACED").count(5L).build(),
                OrderStatusSummaryResponse.builder().status("COMPLETED").count(10L).build()
        );
        when(analyticsRepository.findOrderCountByStatus(1L)).thenReturn(mockSummary);

        List<OrderStatusSummaryResponse> result = analyticsService.getOrderCountByStatus(1L, 42L);
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("Should throw when truck not found")
    void validateTruckOwnership_shouldThrow_whenTruckNotFound() {
        when(truckServiceClient.getTruckById(999L))
                .thenThrow(feign.FeignException.NotFound.class);
        assertThatThrownBy(() -> analyticsService.getDailySales(999L, 42L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Truck not found");
    }
}
