package com.truckbites.truck.repository;

import com.truckbites.truck.entity.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TruckRepository extends JpaRepository<Truck, Long> {

    List<Truck> findByOwnerId(Long ownerId);

    List<Truck> findByCuisineTypeContainingIgnoreCase(String cuisine);

    @Query(value = """
            SELECT t.* FROM (
                SELECT *, (
                    6371 * acos(
                        cos(radians(:lat)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(latitude))
                    )
                ) AS distance
                FROM trucks
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ) t
            WHERE t.distance < :radiusKm
            ORDER BY t.distance
            """, nativeQuery = true)
    List<Truck> findNearbyTrucks(@Param("lat") double lat,
                                 @Param("lng") double lng,
                                 @Param("radiusKm") double radiusKm);
}
