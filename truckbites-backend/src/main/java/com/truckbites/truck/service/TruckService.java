package com.truckbites.truck.service;

import com.truckbites.auth.entity.Role;
import com.truckbites.auth.entity.User;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import com.truckbites.truck.dto.LocationUpdateRequest;
import com.truckbites.truck.dto.TruckDto;
import com.truckbites.truck.dto.TruckSearchFilter;
import com.truckbites.truck.entity.Truck;
import com.truckbites.truck.entity.TruckStatus;
import com.truckbites.truck.repository.TruckRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TruckService {

    private final TruckRepository truckRepository;
    private final UserRepository userRepository;

    public TruckService(TruckRepository truckRepository, UserRepository userRepository) {
        this.truckRepository = truckRepository;
        this.userRepository = userRepository;
    }

    public Truck createTruck(TruckDto dto, Long ownerId) {
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        if (user.getRole() != Role.VENDOR) {
            throw new UnauthorizedException("Only VENDOR users can create trucks");
        }

        Truck truck = Truck.builder()
                .name(dto.getName())
                .cuisineType(dto.getCuisineType())
                .description(dto.getDescription())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .status(TruckStatus.CLOSED)
                .ownerId(ownerId)
                .imageUrl(dto.getImageUrl())
                .build();

        return truckRepository.save(truck);
    }

    public Truck updateTruck(Long id, TruckDto dto, Long ownerId) {
        Truck truck = truckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", id));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        if (dto.getName() != null) {
            truck.setName(dto.getName());
        }
        if (dto.getCuisineType() != null) {
            truck.setCuisineType(dto.getCuisineType());
        }
        if (dto.getDescription() != null) {
            truck.setDescription(dto.getDescription());
        }
        if (dto.getLatitude() != null) {
            truck.setLatitude(dto.getLatitude());
        }
        if (dto.getLongitude() != null) {
            truck.setLongitude(dto.getLongitude());
        }
        if (dto.getImageUrl() != null) {
            truck.setImageUrl(dto.getImageUrl());
        }
        if (dto.getStatus() != null) {
            truck.setStatus(dto.getStatus());
        }

        return truckRepository.save(truck);
    }

    public Truck updateLocation(Long id, LocationUpdateRequest request, Long ownerId) {
        Truck truck = truckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", id));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        truck.setLatitude(request.getLatitude());
        truck.setLongitude(request.getLongitude());

        return truckRepository.save(truck);
    }

    public Truck getTruckById(Long id) {
        return truckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", id));
    }

    public List<Truck> searchTrucks(TruckSearchFilter filter) {
        String cuisineType = filter.getCuisineType();
        Double lat = filter.getLatitude();
        Double lng = filter.getLongitude();
        Double radiusKm = filter.getRadiusKm();

        if (lat != null && lng != null && radiusKm != null) {
            List<Truck> nearby = truckRepository.findNearbyTrucks(lat, lng, radiusKm);
            if (cuisineType != null && !cuisineType.isBlank()) {
                return nearby.stream()
                        .filter(t -> t.getCuisineType().toLowerCase().contains(cuisineType.toLowerCase()))
                        .collect(Collectors.toList());
            }
            return nearby;
        }

        if (cuisineType != null && !cuisineType.isBlank()) {
            return truckRepository.findByCuisineTypeContainingIgnoreCase(cuisineType);
        }

        return truckRepository.findAll();
    }

    public List<Truck> getTrucksByOwnerId(Long ownerId) {
        return truckRepository.findByOwnerId(ownerId);
    }

    public void deleteTruck(Long id, Long ownerId) {
        Truck truck = truckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck", "id", id));

        if (!truck.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this truck");
        }

        truckRepository.delete(truck);
    }
}
