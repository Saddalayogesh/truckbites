package com.truckbites.truck.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.truck.client.OrderDto;
import com.truckbites.truck.client.OrderServiceClient;
import com.truckbites.truck.model.Review;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.repository.ReviewRepository;
import com.truckbites.truck.repository.TruckRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TruckRepository truckRepository;
    private final OrderServiceClient orderServiceClient;

    /**
     * Adds a review for a completed order.
     * Validates that:
     * 1. The order exists via order-service Feign call
     * 2. The order status is COMPLETED
     * 3. The order belongs to the specified truck
     * 4. The order hasn't been reviewed yet
     * After saving, recalculates and updates the truck's average rating.
     */
    @Transactional
    public Review addReview(Long customerId, Long truckId, Long orderId, Integer rating, String comment) {
        log.info("Adding review: customerId={}, truckId={}, orderId={}, rating={}",
                customerId, truckId, orderId, rating);

        // Validate truck exists
        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> {
                    log.warn("Truck not found for review: truckId={}", truckId);
                    return new ResourceNotFoundException("Truck not found with id: " + truckId);
                });

        // Validate order exists and is COMPLETED via Feign call to order-service
        OrderDto order;
        try {
            order = orderServiceClient.getOrderById(orderId);
        } catch (FeignException.NotFound e) {
            log.warn("Order not found: orderId={}", orderId);
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        } catch (FeignException e) {
            log.error("Failed to call order-service for orderId: {}", orderId, e);
            throw new IllegalStateException("Unable to validate order. Please try again later.");
        }

        // Validate order belongs to this truck
        if (!order.getTruckId().equals(truckId)) {
            log.warn("Order {} does not belong to truck {}", orderId, truckId);
            throw new IllegalArgumentException("Order does not belong to this truck");
        }

        // Validate order is COMPLETED
        if (!"COMPLETED".equals(order.getStatus())) {
            log.warn("Order {} is not COMPLETED (status: {}), cannot review", orderId, order.getStatus());
            throw new IllegalStateException("Only completed orders can be reviewed");
        }

        // Check if order has already been reviewed
        if (reviewRepository.findByOrderId(orderId).isPresent()) {
            log.warn("Order {} has already been reviewed", orderId);
            throw new IllegalStateException("Order has already been reviewed");
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Review review = Review.builder()
                .customerId(customerId)
                .truckId(truckId)
                .orderId(orderId)
                .rating(rating)
                .comment(comment)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review added: id={}, orderId={}, rating={}", saved.getId(), orderId, rating);

        // Update cached average rating on Truck entity
        updateAverageRating(truck);

        return saved;
    }

    /**
     * Returns all reviews for a specific truck, ordered by most recent first.
     */
    @Transactional(readOnly = true)
    public List<Review> getReviewsByTruck(Long truckId) {
        log.debug("Fetching reviews for truckId: {}", truckId);

        // Validate truck exists
        truckRepository.findById(truckId)
                .orElseThrow(() -> {
                    log.warn("Truck not found: truckId={}", truckId);
                    return new ResourceNotFoundException("Truck not found with id: " + truckId);
                });

        return reviewRepository.findByTruckIdOrderByCreatedAtDesc(truckId);
    }

    /**
     * Recalculates and updates the cached average rating on the Truck entity.
     */
    private void updateAverageRating(Truck truck) {
        Double avg = reviewRepository.findAverageRatingByTruckId(truck.getId());
        if (avg == null) {
            avg = 0.0;
        }
        // Round to 1 decimal place
        avg = Math.round(avg * 10.0) / 10.0;
        truck.setAverageRating(avg);
        truckRepository.save(truck);
        log.info("Updated average rating for truckId={} to {}", truck.getId(), avg);
    }
}
