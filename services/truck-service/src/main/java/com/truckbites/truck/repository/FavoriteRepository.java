package com.truckbites.truck.repository;

import com.truckbites.truck.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<Favorite> findByCustomerIdAndTruckId(Long customerId, Long truckId);

    boolean existsByCustomerIdAndTruckId(Long customerId, Long truckId);

    void deleteByCustomerIdAndTruckId(Long customerId, Long truckId);
}
