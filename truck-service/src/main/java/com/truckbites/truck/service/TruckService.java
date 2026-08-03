package com.truckbites.truck.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.model.TruckStatus;
import com.truckbites.truck.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TruckService {

    private final TruckRepository truckRepository;

    public Truck createTruck(CreateTruckRequest request, Long ownerId) {
        log.info("Creating truck '{}' for ownerId: {}", request.getName(), ownerId);
        Truck truck = Truck.builder()
                .name(request.getName())
                .cuisineType(request.getCuisineType())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .imageUrl(request.getImageUrl())
                .ownerId(ownerId)
                .status(TruckStatus.CLOSED)
                .build();
        Truck saved = truckRepository.save(truck);
        log.info("Truck created with id: {} for ownerId: {}", saved.getId(), ownerId);
        return saved;
    }

    public Truck updateTruck(Long id, CreateTruckRequest request, Long ownerId) {
        log.debug("Updating truck id: {} for ownerId: {}", id, ownerId);
        Truck truck = truckRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> {
                    log.warn("Truck not found or not owned by user: id={}, ownerId={}", id, ownerId);
                    return new ResourceNotFoundException("Truck not found or access denied");
                });
        truck.setName(request.getName());
        truck.setCuisineType(request.getCuisineType());
        truck.setDescription(request.getDescription());
        truck.setLatitude(request.getLatitude());
        truck.setLongitude(request.getLongitude());
        truck.setImageUrl(request.getImageUrl());
        Truck saved = truckRepository.save(truck);
        log.info("Truck updated: id={}", id);
        return saved;
    }

    public Truck updateLocation(Long id, UpdateLocationRequest request, Long ownerId) {
        log.debug("Updating location for truck id: {} for ownerId: {}", id, ownerId);
        Truck truck = truckRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> {
                    log.warn("Truck not found or not owned by user: id={}, ownerId={}", id, ownerId);
                    return new ResourceNotFoundException("Truck not found or access denied");
                });
        truck.setLatitude(request.getLatitude());
        truck.setLongitude(request.getLongitude());
        Truck saved = truckRepository.save(truck);
        log.info("Location updated for truck id: {}", id);
        return saved;
    }

    public Truck getTruckById(Long id) {
        log.debug("Fetching truck by id: {}", id);
        return truckRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Truck not found with id: {}", id);
                    return new ResourceNotFoundException("Truck not found with id: " + id);
                });
    }

    public List<Truck> searchTrucks(String cuisineType, Double latitude, Double longitude, Double radiusKm) {
        log.debug("Searching trucks - cuisineType: {}, location: ({},{}), radius: {}km",
                cuisineType, latitude, longitude, radiusKm);

        if (latitude != null && longitude != null && radiusKm != null) {
            log.debug("Using nearby search with bounding box + Haversine filter");
            return findNearbyTrucks(latitude, longitude, radiusKm);
        }

        if (cuisineType != null && !cuisineType.isBlank()) {
            log.debug("Filtering by cuisineType: {}", cuisineType);
            return truckRepository.findByCuisineTypeContainingIgnoreCase(cuisineType);
        }

        log.debug("Returning all trucks");
        return truckRepository.findAll();
    }

    public List<Truck> getMyTrucks(Long ownerId) {
        log.debug("Fetching trucks for ownerId: {}", ownerId);
        return truckRepository.findByOwnerId(ownerId);
    }

    /**
     * Returns the top 6 trending trucks ranked by average rating (descending).
     */
    public List<Truck> getTrendingTrucks() {
        log.debug("Fetching top 6 trending trucks by average rating");
        return truckRepository.findTop6ByOrderByAverageRatingDesc();
    }

    private List<Truck> findNearbyTrucks(Double latitude, Double longitude, Double radiusKm) {
        log.debug("Finding trucks near lat: {}, lon: {}, radius: {}km", latitude, longitude, radiusKm);

        // Bounding box approximation: 1 deg lat ≈ 111km, 1 deg lon ≈ 111*cos(lat) km
        double latDelta = radiusKm / 111.0;
        double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(latitude)));

        List<Truck> candidates = truckRepository.findTrucksInBoundingBox(
                latitude - latDelta, latitude + latDelta,
                longitude - lonDelta, longitude + lonDelta);

        // Precise Haversine distance filter in Java
        return candidates.stream()
                .filter(truck -> {
                    double dLat = Math.toRadians(truck.getLatitude() - latitude);
                    double dLon = Math.toRadians(truck.getLongitude() - longitude);
                    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                            + Math.cos(Math.toRadians(latitude))
                            * Math.cos(Math.toRadians(truck.getLatitude()))
                            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return (6371 * c) < radiusKm;
                })
                .toList();
    }

    public void deleteTruck(Long id, Long ownerId) {
        log.debug("Deleting truck id: {} for ownerId: {}", id, ownerId);
        Truck truck = truckRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> {
                    log.warn("Truck not found or not owned by user: id={}, ownerId={}", id, ownerId);
                    return new ResourceNotFoundException("Truck not found or access denied");
                });
        truckRepository.delete(truck);
        log.info("Truck deleted: id={}", id);
    }

    /**
     * Toggles a truck's operational status (OPEN ↔ CLOSED).
     * The vendor must own the truck.
     */
    @Transactional
    public Truck toggleStatus(Long id, Long ownerId) {
        log.debug("Toggling status for truck id: {} for ownerId: {}", id, ownerId);
        Truck truck = truckRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> {
                    log.warn("Truck not found or not owned by user: id={}, ownerId={}", id, ownerId);
                    return new ResourceNotFoundException("Truck not found or access denied");
                });
        truck.setStatus(truck.getStatus() == TruckStatus.OPEN ? TruckStatus.CLOSED : TruckStatus.OPEN);
        Truck saved = truckRepository.save(truck);
        log.info("Truck status toggled to {} for id: {}", saved.getStatus(), id);
        return saved;
    }

    /**
     * Returns all trucks (admin-only).
     */
    public List<Truck> getAllTrucks() {
        log.debug("Fetching all trucks for admin");
        return truckRepository.findAll();
    }
}
