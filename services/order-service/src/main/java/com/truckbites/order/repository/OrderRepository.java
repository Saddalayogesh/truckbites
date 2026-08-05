package com.truckbites.order.repository;

import com.truckbites.order.model.Order;
import com.truckbites.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByTruckIdOrderByCreatedAtDesc(Long truckId);

    List<Order> findByTruckIdAndStatusOrderByCreatedAtAsc(Long truckId, OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();
}
