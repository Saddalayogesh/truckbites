package com.truckbites.menu.repository;

import com.truckbites.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByTruckId(Long truckId);

    List<MenuItem> findByTruckIdAndIsAvailableTrue(Long truckId);
}
