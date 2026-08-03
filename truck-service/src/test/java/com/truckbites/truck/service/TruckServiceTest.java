package com.truckbites.truck.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.model.TruckStatus;
import com.truckbites.truck.repository.TruckRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TruckServiceTest {

    @Mock
    private TruckRepository truckRepository;

    @InjectMocks
    private TruckService truckService;

    @Captor
    private ArgumentCaptor<Truck> truckCaptor;

    private Truck createDefaultTruck(Long id, Long ownerId) {
        return Truck.builder()
                .id(id)
                .name("Taco Truck")
                .cuisineType("Mexican")
                .description("Best tacos in town")
                .latitude(40.7128)
                .longitude(-74.0060)
                .status(TruckStatus.CLOSED)
                .ownerId(ownerId)
                .imageUrl("https://example.com/taco.jpg")
                .build();
    }

    private CreateTruckRequest createDefaultRequest() {
        CreateTruckRequest request = new CreateTruckRequest();
        request.setName("Taco Truck");
        request.setCuisineType("Mexican");
        request.setDescription("Best tacos in town");
        request.setLatitude(40.7128);
        request.setLongitude(-74.0060);
        request.setImageUrl("https://example.com/taco.jpg");
        return request;
    }

    // ──────────── createTruck ────────────

    @Test
    @DisplayName("Should create a truck with CLOSED status")
    void createTruck_shouldCreateAndReturnTruck() {
        // Arrange
        CreateTruckRequest request = createDefaultRequest();

        Truck savedTruck = createDefaultTruck(1L, 42L);
        when(truckRepository.save(any(Truck.class))).thenReturn(savedTruck);

        // Act
        Truck result = truckService.createTruck(request, 42L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Taco Truck");
        assertThat(result.getCuisineType()).isEqualTo("Mexican");
        assertThat(result.getStatus()).isEqualTo(TruckStatus.CLOSED);
        assertThat(result.getOwnerId()).isEqualTo(42L);

        verify(truckRepository).save(truckCaptor.capture());
        Truck captured = truckCaptor.getValue();
        assertThat(captured.getStatus()).isEqualTo(TruckStatus.CLOSED);
        assertThat(captured.getOwnerId()).isEqualTo(42L);
        assertThat(captured.getName()).isEqualTo("Taco Truck");
    }

    // ──────────── getTruckById ────────────

    @Test
    @DisplayName("Should return truck when id exists")
    void getTruckById_shouldReturnTruck_whenExists() {
        // Arrange
        Truck truck = createDefaultTruck(1L, 42L);
        when(truckRepository.findById(1L)).thenReturn(Optional.of(truck));

        // Act
        Truck result = truckService.getTruckById(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Taco Truck");

        verify(truckRepository).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when truck id not found")
    void getTruckById_shouldThrowException_whenNotFound() {
        // Arrange
        when(truckRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.getTruckById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Truck not found with id: 999");

        verify(truckRepository).findById(999L);
    }

    // ──────────── updateTruck ────────────

    @Test
    @DisplayName("Should update truck when owned by user")
    void updateTruck_shouldUpdateAndReturnTruck() {
        // Arrange
        Truck existingTruck = createDefaultTruck(1L, 42L);
        when(truckRepository.findByIdAndOwnerId(1L, 42L)).thenReturn(Optional.of(existingTruck));
        when(truckRepository.save(any(Truck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTruckRequest updateRequest = new CreateTruckRequest();
        updateRequest.setName("Super Tacos");
        updateRequest.setCuisineType("Mexican Fusion");
        updateRequest.setDescription("Updated description");
        updateRequest.setLatitude(34.0522);
        updateRequest.setLongitude(-118.2437);
        updateRequest.setImageUrl("https://example.com/new.jpg");

        // Act
        Truck result = truckService.updateTruck(1L, updateRequest, 42L);

        // Assert
        assertThat(result.getName()).isEqualTo("Super Tacos");
        assertThat(result.getCuisineType()).isEqualTo("Mexican Fusion");
        assertThat(result.getLatitude()).isEqualTo(34.0522);
        assertThat(result.getLongitude()).isEqualTo(-118.2437);

        verify(truckRepository).findByIdAndOwnerId(1L, 42L);
        verify(truckRepository).save(any(Truck.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when updating truck not owned by user")
    void updateTruck_shouldThrowException_whenNotOwner() {
        // Arrange
        when(truckRepository.findByIdAndOwnerId(1L, 99L)).thenReturn(Optional.empty());

        CreateTruckRequest request = createDefaultRequest();

        // Act & Assert
        assertThatThrownBy(() -> truckService.updateTruck(1L, request, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Truck not found or access denied");

        verify(truckRepository).findByIdAndOwnerId(1L, 99L);
        verify(truckRepository, never()).save(any());
    }

    // ──────────── updateLocation ────────────

    @Test
    @DisplayName("Should update truck location")
    void updateLocation_shouldUpdateAndReturnTruck() {
        // Arrange
        Truck existingTruck = createDefaultTruck(1L, 42L);
        when(truckRepository.findByIdAndOwnerId(1L, 42L)).thenReturn(Optional.of(existingTruck));
        when(truckRepository.save(any(Truck.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateLocationRequest locationRequest = new UpdateLocationRequest();
        locationRequest.setLatitude(34.0522);
        locationRequest.setLongitude(-118.2437);

        // Act
        Truck result = truckService.updateLocation(1L, locationRequest, 42L);

        // Assert
        assertThat(result.getLatitude()).isEqualTo(34.0522);
        assertThat(result.getLongitude()).isEqualTo(-118.2437);
        // Other fields unchanged
        assertThat(result.getName()).isEqualTo("Taco Truck");

        verify(truckRepository).findByIdAndOwnerId(1L, 42L);
        verify(truckRepository).save(any(Truck.class));
    }

    @Test
    @DisplayName("Should throw exception when updating location for non-owned truck")
    void updateLocation_shouldThrowException_whenNotOwner() {
        // Arrange
        when(truckRepository.findByIdAndOwnerId(1L, 99L)).thenReturn(Optional.empty());
        UpdateLocationRequest request = new UpdateLocationRequest();
        request.setLatitude(34.0522);
        request.setLongitude(-118.2437);

        // Act & Assert
        assertThatThrownBy(() -> truckService.updateLocation(1L, request, 99L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(truckRepository).findByIdAndOwnerId(1L, 99L);
        verify(truckRepository, never()).save(any());
    }

    // ──────────── searchTrucks ────────────

    @Test
    @DisplayName("Should search trucks by cuisine type")
    void searchTrucks_shouldFilterByCuisineType() {
        // Arrange
        List<Truck> trucks = List.of(
                createDefaultTruck(1L, 42L),
                createDefaultTruck(2L, 43L)
        );
        when(truckRepository.findByCuisineTypeContainingIgnoreCase("Mexican")).thenReturn(trucks);

        // Act
        List<Truck> result = truckService.searchTrucks("Mexican", null, null, null);

        // Assert
        assertThat(result).hasSize(2);
        verify(truckRepository).findByCuisineTypeContainingIgnoreCase("Mexican");
        verify(truckRepository, never()).findAll();
    }

    @Test
    @DisplayName("Should return all trucks when no filters provided")
    void searchTrucks_shouldReturnAll_whenNoFilters() {
        // Arrange
        when(truckRepository.findAll()).thenReturn(List.of(
                createDefaultTruck(1L, 42L),
                createDefaultTruck(2L, 43L),
                createDefaultTruck(3L, 44L)
        ));

        // Act
        List<Truck> result = truckService.searchTrucks(null, null, null, null);

        // Assert
        assertThat(result).hasSize(3);
        verify(truckRepository).findAll();
        verify(truckRepository, never()).findByCuisineTypeContainingIgnoreCase(any());
    }

    @Test
    @DisplayName("Should find trucks near a location")
    void searchTrucks_shouldFindNearbyTrucks() {
        // Arrange
        Truck nearbyTruck = Truck.builder()
                .id(1L)
                .name("Nearby Truck")
                .cuisineType("Italian")
                .latitude(40.7130)
                .longitude(-74.0065)
                .ownerId(42L)
                .status(TruckStatus.OPEN)
                .build();

        Truck farTruck = Truck.builder()
                .id(2L)
                .name("Far Truck")
                .cuisineType("Chinese")
                .latitude(41.0000)
                .longitude(-74.5000)
                .ownerId(43L)
                .status(TruckStatus.OPEN)
                .build();

        // The bounding box should include both
        when(truckRepository.findTrucksInBoundingBox(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(nearbyTruck, farTruck));

        // Act - search near NYC with 5km radius
        List<Truck> result = truckService.searchTrucks(null, 40.7128, -74.0060, 5.0);

        // Assert
        // Only the nearby truck should pass Haversine filter
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Nearby Truck");

        verify(truckRepository).findTrucksInBoundingBox(anyDouble(), anyDouble(), anyDouble(), anyDouble());
    }

    // ──────────── getMyTrucks ────────────

    @Test
    @DisplayName("Should return trucks for owner")
    void getMyTrucks_shouldReturnTrucksForOwner() {
        // Arrange
        List<Truck> ownerTrucks = List.of(
                createDefaultTruck(1L, 42L),
                createDefaultTruck(2L, 42L)
        );
        when(truckRepository.findByOwnerId(42L)).thenReturn(ownerTrucks);

        // Act
        List<Truck> result = truckService.getMyTrucks(42L);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(t -> t.getOwnerId().equals(42L));
        verify(truckRepository).findByOwnerId(42L);
    }

    @Test
    @DisplayName("Should return empty list when owner has no trucks")
    void getMyTrucks_shouldReturnEmptyList_whenNoTrucks() {
        // Arrange
        when(truckRepository.findByOwnerId(999L)).thenReturn(List.of());

        // Act
        List<Truck> result = truckService.getMyTrucks(999L);

        // Assert
        assertThat(result).isEmpty();
        verify(truckRepository).findByOwnerId(999L);
    }

    // ──────────── getTrendingTrucks ────────────

    @Test
    @DisplayName("Should return top 6 trucks by average rating descending")
    void getTrendingTrucks_shouldReturnTopRatedTrucks() {
        // Arrange
        List<Truck> trending = List.of(
                createDefaultTruck(1L, 42L),
                createDefaultTruck(2L, 43L)
        );
        when(truckRepository.findTop6ByOrderByAverageRatingDesc()).thenReturn(trending);

        // Act
        List<Truck> result = truckService.getTrendingTrucks();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).isEqualTo(trending);
        verify(truckRepository).findTop6ByOrderByAverageRatingDesc();
    }

    @Test
    @DisplayName("Should return empty list when no trucks exist")
    void getTrendingTrucks_shouldReturnEmptyList_whenNoTrucks() {
        // Arrange
        when(truckRepository.findTop6ByOrderByAverageRatingDesc()).thenReturn(List.of());

        // Act
        List<Truck> result = truckService.getTrendingTrucks();

        // Assert
        assertThat(result).isEmpty();
        verify(truckRepository).findTop6ByOrderByAverageRatingDesc();
    }

    // ──────────── deleteTruck ────────────

    @Test
    @DisplayName("Should delete truck when owned by user")
    void deleteTruck_shouldDelete_whenOwnedByUser() {
        // Arrange
        Truck truck = createDefaultTruck(1L, 42L);
        when(truckRepository.findByIdAndOwnerId(1L, 42L)).thenReturn(Optional.of(truck));

        // Act
        truckService.deleteTruck(1L, 42L);

        // Assert
        verify(truckRepository).findByIdAndOwnerId(1L, 42L);
        verify(truckRepository).delete(truck);
    }

    @Test
    @DisplayName("Should throw exception when deleting truck not owned by user")
    void deleteTruck_shouldThrowException_whenNotOwner() {
        // Arrange
        when(truckRepository.findByIdAndOwnerId(1L, 99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.deleteTruck(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(truckRepository).findByIdAndOwnerId(1L, 99L);
        verify(truckRepository, never()).delete(any());
    }
}
