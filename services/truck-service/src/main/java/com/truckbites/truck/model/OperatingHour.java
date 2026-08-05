package com.truckbites.truck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "operating_hours", schema = "truckbites_truck_db",
       uniqueConstraints = @UniqueConstraint(columnNames = {"truck_id", "day_of_week"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatingHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 0=Monday, 1=Tuesday ... 6=Sunday

    @Column(name = "open_time")
    private String openTime; // HH:mm format, e.g. "09:00"

    @Column(name = "close_time")
    private String closeTime; // HH:mm format, e.g. "21:00"

    @Column(name = "is_closed")
    @Builder.Default
    private Boolean isClosed = true;
}
