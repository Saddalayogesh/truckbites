package com.truckbites.truck.repository;

import com.truckbites.truck.model.OperatingHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OperatingHourRepository extends JpaRepository<OperatingHour, Long> {

    List<OperatingHour> findByTruckIdOrderByDayOfWeekAsc(Long truckId);

    Optional<OperatingHour> findByTruckIdAndDayOfWeek(Long truckId, Integer dayOfWeek);

    void deleteByTruckId(Long truckId);
}
