package com.truckbites.truck.repository;

import com.truckbites.truck.model.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TruckRepository extends JpaRepository<Truck, Long> {

    List<Truck> findByOwnerId(Long ownerId);

    List<Truck> findByCuisineTypeContainingIgnoreCase(String cuisineType);

    Optional<Truck> findByIdAndOwnerId(Long id, Long ownerId);

    /**
     * Finds trucks within a radius using bounding-box pre-filtering (native query)
     * followed by precise Haversine distance filtering in Java.
     * This avoids JPA mapping issues with computed columns in native queries.
     */
    @Query(value = "SELECT t.* FROM truckbites_truck_db.trucks t WHERE " +
           "t.latitude BETWEEN :minLat AND :maxLat AND " +
           "t.longitude BETWEEN :minLon AND :maxLon",
           nativeQuery = true)
    List<Truck> findTrucksInBoundingBox(
            @Param("minLat") Double minLatitude,
            @Param("maxLat") Double maxLatitude,
            @Param("minLon") Double minLongitude,
            @Param("maxLon") Double maxLongitude);
}
