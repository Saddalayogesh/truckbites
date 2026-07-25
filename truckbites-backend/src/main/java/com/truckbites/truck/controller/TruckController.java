package com.truckbites.truck.controller;

import com.truckbites.auth.entity.User;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.truck.dto.LocationUpdateRequest;
import com.truckbites.truck.dto.TruckDto;
import com.truckbites.truck.dto.TruckSearchFilter;
import com.truckbites.truck.entity.Truck;
import com.truckbites.truck.service.TruckService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trucks")
public class TruckController {

    private final TruckService truckService;
    private final UserRepository userRepository;

    public TruckController(TruckService truckService, UserRepository userRepository) {
        this.truckService = truckService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<TruckDto> createTruck(@Valid @RequestBody TruckDto dto) {
        Long ownerId = getCurrentUserId();
        Truck truck = truckService.createTruck(dto, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(TruckDto.fromEntity(truck));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<TruckDto> updateTruck(@PathVariable Long id,
                                                 @Valid @RequestBody TruckDto dto) {
        Long ownerId = getCurrentUserId();
        Truck truck = truckService.updateTruck(id, dto, ownerId);
        return ResponseEntity.ok(TruckDto.fromEntity(truck));
    }

    @PutMapping("/{id}/location")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<TruckDto> updateLocation(@PathVariable Long id,
                                                    @Valid @RequestBody LocationUpdateRequest request) {
        Long ownerId = getCurrentUserId();
        Truck truck = truckService.updateLocation(id, request, ownerId);
        return ResponseEntity.ok(TruckDto.fromEntity(truck));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TruckDto> getTruckById(@PathVariable Long id) {
        Truck truck = truckService.getTruckById(id);
        return ResponseEntity.ok(TruckDto.fromEntity(truck));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TruckDto>> searchTrucks(
            @RequestParam(required = false) String cuisineType,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm) {
        TruckSearchFilter filter = new TruckSearchFilter(cuisineType, latitude, longitude, radiusKm);
        List<Truck> trucks = truckService.searchTrucks(filter);
        List<TruckDto> response = trucks.stream()
                .map(TruckDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-trucks")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<TruckDto>> getMyTrucks() {
        Long ownerId = getCurrentUserId();
        List<Truck> trucks = truckService.getTrucksByOwnerId(ownerId);
        List<TruckDto> response = trucks.stream()
                .map(TruckDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteTruck(@PathVariable Long id) {
        Long ownerId = getCurrentUserId();
        truckService.deleteTruck(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
        return user.getId();
    }
}
