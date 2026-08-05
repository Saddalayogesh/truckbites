package com.truckbites.truck.repository;

import com.truckbites.truck.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTruckIdOrderByCreatedAtDesc(Long truckId);

    Optional<Review> findByOrderId(Long orderId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.truckId = :truckId")
    Double findAverageRatingByTruckId(@Param("truckId") Long truckId);

    long countByTruckId(Long truckId);
}
