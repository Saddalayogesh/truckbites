package com.truckbites.truck.service;

import com.truckbites.common.exception.BadRequestException;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.payment.RazorpayPaymentVerifier;
import com.truckbites.truck.payment.RazorpayOrderAmountVerifier;
import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.model.TruckStatus;
import com.truckbites.truck.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TruckService {

    /** Featured promotion prices in paise, keyed by duration in days. */
    private static final Map<Integer, Long> PROMO_PRICES_PAISE = Map.of(
            7, 29900L,
            15, 49900L,
            30, 79900L
    );

    private final TruckRepository truckRepository;
    private final RazorpayOrderAmountVerifier razorpayOrderAmountVerifier;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    public Truck createTruck(CreateTruckRequest request, Long ownerId) {
        log.info("Creating truck '{}' for ownerId: {}", request.getName(), ownerId);
        Truck truck = Truck.builder()
                .name(request.getName())
                .cuisineType(request.getCuisineType())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .imageUrl(request.getImageUrl())
                .estimatedPrepTimeMinutes(request.getEstimatedPrepTimeMinutes() != null
                        ? request.getEstimatedPrepTimeMinutes() : 15)
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
        truck.setEstimatedPrepTimeMinutes(request.getEstimatedPrepTimeMinutes() != null
                ? request.getEstimatedPrepTimeMinutes() : 15);
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
            return sortFeaturedFirst(findNearbyTrucks(latitude, longitude, radiusKm));
        }

        if (cuisineType != null && !cuisineType.isBlank()) {
            log.debug("Filtering by cuisineType: {}", cuisineType);
            return sortFeaturedFirst(truckRepository.findByCuisineTypeContainingIgnoreCase(cuisineType));
        }

        log.debug("Returning all trucks");
        return sortFeaturedFirst(truckRepository.findAll());
    }

    public List<Truck> getMyTrucks(Long ownerId) {
        log.debug("Fetching trucks for ownerId: {}", ownerId);
        return truckRepository.findByOwnerId(ownerId);
    }

    /**
     * Returns the top 6 trending trucks ranked by average rating (descending),
     * with currently-featured trucks surfaced first.
     */
    public List<Truck> getTrendingTrucks() {
        log.debug("Fetching top 6 trending trucks by average rating");
        return sortFeaturedFirst(truckRepository.findTop6ByOrderByAverageRatingDesc());
    }

    /**
     * Promotes a truck as featured for the given number of days.
     * Supported durations: 7, 15 or 30 days. Re-promoting an active promotion
     * extends it from the current expiry date.
     * The promotion only activates once the vendor's Razorpay payment is
     * verified via the supplied payment signature.
     */
    @Transactional
    public Truck featureTruck(Long id, Long ownerId, Integer days,
                              String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        RazorpayPaymentVerifier.requireValidSignature(razorpayKeySecret, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (days == null || (days != 7 && days != 15 && days != 30)) {
            log.warn("Invalid promotion duration: {}", days);
            throw new BadRequestException("Promotion duration must be 7, 15 or 30 days");
        }
        Long pricePaise = PROMO_PRICES_PAISE.get(days);
        if (pricePaise == null || !razorpayOrderAmountVerifier.matches(razorpayOrderId, pricePaise)) {
            log.warn("Razorpay amount mismatch for orderId={}, expectedPaise={}", razorpayOrderId, pricePaise);
            throw new BadRequestException("Promotion payment does not match the selected duration's price. Please try again.");
        }
        log.debug("Promoting truck id: {} for {} days by ownerId: {}", id, days, ownerId);
        Truck truck = truckRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> {
                    log.warn("Truck not found or not owned by user: id={}, ownerId={}", id, ownerId);
                    return new ResourceNotFoundException("Truck not found or access denied");
                });
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = (truck.getFeaturedUntil() != null && truck.getFeaturedUntil().isAfter(now))
                ? truck.getFeaturedUntil()
                : now;
        truck.setFeaturedUntil(base.plusDays(days));
        Truck saved = truckRepository.save(truck);
        log.info("Truck {} featured until {}", id, saved.getFeaturedUntil());
        return saved;
    }

    /**
     * Sorts trucks so that currently-featured promotions appear first
     * (most recently promoted first), followed by non-featured trucks.
     */
    private List<Truck> sortFeaturedFirst(List<Truck> trucks) {
        LocalDateTime now = LocalDateTime.now();
        return trucks.stream()
                .sorted(Comparator
                        .comparing((Truck t) -> isFeatured(t, now), Comparator.reverseOrder())
                        .thenComparing(t -> t.getFeaturedUntil() == null
                                ? LocalDateTime.MIN : t.getFeaturedUntil(), Comparator.reverseOrder()))
                .toList();
    }

    private boolean isFeatured(Truck truck, LocalDateTime now) {
        return truck.getFeaturedUntil() != null && truck.getFeaturedUntil().isAfter(now);
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
