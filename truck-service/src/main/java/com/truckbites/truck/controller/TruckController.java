package com.truckbites.truck.controller;

import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.service.TruckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

@Slf4j
@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;

    @GetMapping("/search")
    public ResponseEntity<List<Truck>> searchTrucks(
            @RequestParam(required = false) String cuisineType,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm) {

        log.info("Search trucks: cuisineType={}, location=({},{}), radius={}km",
                cuisineType, latitude, longitude, radiusKm);
        return ResponseEntity.ok(
                truckService.searchTrucks(cuisineType, latitude, longitude, radiusKm));
    }

    @GetMapping("/my-trucks")
    public ResponseEntity<List<Truck>> getMyTrucks(Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Get my trucks for ownerId: {}", ownerId);
        return ResponseEntity.ok(truckService.getMyTrucks(ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Truck> getTruck(@PathVariable Long id) {
        log.info("Get truck by id: {}", id);
        return ResponseEntity.ok(truckService.getTruckById(id));
    }

    @PostMapping
    public ResponseEntity<Truck> createTruck(
            @Valid @RequestBody CreateTruckRequest request,
            Authentication authentication) {

        checkVendorRole(authentication);
        Long ownerId = extractUserId(authentication);
        log.info("Create truck: name='{}', ownerId={}", request.getName(), ownerId);
        Truck truck = truckService.createTruck(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(truck);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Truck> updateTruck(
            @PathVariable Long id,
            @Valid @RequestBody CreateTruckRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update truck: id={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(truckService.updateTruck(id, request, ownerId));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<Truck> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocationRequest request,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Update location: truckId={}, ownerId={}", id, ownerId);
        return ResponseEntity.ok(truckService.updateLocation(id, request, ownerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTruck(
            @PathVariable Long id,
            Authentication authentication) {
        Long ownerId = extractUserId(authentication);
        log.info("Delete truck: id={}, ownerId={}", id, ownerId);
        truckService.deleteTruck(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Ensures the authenticated user has the VENDOR role.
     * Called only for truck creation (VENDOR-only operation).
     */
    private void checkVendorRole(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isVendor = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VENDOR"));
        if (!isVendor) {
            log.warn("Non-VENDOR user attempted to create a truck");
            throw new AccessDeniedException("Only VENDOR users can create trucks");
        }
    }

    /**
     * Extracts the user ID from the Authentication principal.
     * The principal is the email (username) set by JwtValidationFilter.
     * TODO: Extract userId from JWT custom claims once added to auth-service.
     */
    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String email) {
            log.debug("Authenticated user: {}", email);
        }
        return 0L; // Placeholder — replace with userId from JWT claim when available
    }
}
