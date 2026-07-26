package com.truckbites.menu.repository;

import com.truckbites.menu.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByTruckId(Long truckId);

    List<MenuItem> findByTruckIdAndIsAvailableTrue(Long truckId);

    List<MenuItem> findByTruckIdAndCategory(Long truckId, String category);
}
