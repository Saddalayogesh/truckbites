package com.truckbites.truck.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.truck.model.Favorite;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.repository.FavoriteRepository;
import com.truckbites.truck.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final TruckRepository truckRepository;

    /**
     * Adds a truck to the customer's favorites.
     * Validates that the truck exists before adding.
     */
    @Transactional
    public Favorite addFavorite(Long customerId, Long truckId) {
        log.info("Adding favorite: customerId={}, truckId={}", customerId, truckId);

        // Validate truck exists
        truckRepository.findById(truckId)
                .orElseThrow(() -> {
                    log.warn("Truck not found for favorite: truckId={}", truckId);
                    return new ResourceNotFoundException("Truck not found with id: " + truckId);
                });

        // Check if already favorited
        if (favoriteRepository.existsByCustomerIdAndTruckId(customerId, truckId)) {
            log.warn("Favorite already exists for customerId={}, truckId={}", customerId, truckId);
            return favoriteRepository.findByCustomerIdAndTruckId(customerId, truckId).orElseThrow();
        }

        Favorite favorite = Favorite.builder()
                .customerId(customerId)
                .truckId(truckId)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        log.info("Favorite added: id={}, customerId={}, truckId={}",
                saved.getId(), customerId, truckId);
        return saved;
    }

    /**
     * Removes a truck from the customer's favorites.
     */
    @Transactional
    public void removeFavorite(Long customerId, Long truckId) {
        log.info("Removing favorite: customerId={}, truckId={}", customerId, truckId);

        Favorite favorite = favoriteRepository.findByCustomerIdAndTruckId(customerId, truckId)
                .orElseThrow(() -> {
                    log.warn("Favorite not found for customerId={}, truckId={}", customerId, truckId);
                    return new ResourceNotFoundException("Favorite not found");
                });

        favoriteRepository.delete(favorite);
        log.info("Favorite removed: customerId={}, truckId={}", customerId, truckId);
    }

    /**
     * Returns all favorites for a customer, with truck details.
     */
    @Transactional(readOnly = true)
    public List<Favorite> getMyFavorites(Long customerId) {
        log.debug("Fetching favorites for customerId: {}", customerId);
        return favoriteRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    /**
     * Checks if a truck is favorited by a customer.
     */
    @Transactional(readOnly = true)
    public boolean isFavorited(Long customerId, Long truckId) {
        return favoriteRepository.existsByCustomerIdAndTruckId(customerId, truckId);
    }
}
