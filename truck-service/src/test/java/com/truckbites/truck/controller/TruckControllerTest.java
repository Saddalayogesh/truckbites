package com.truckbites.truck.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truckbites.truck.dto.CreateTruckRequest;
import com.truckbites.truck.dto.UpdateLocationRequest;
import com.truckbites.truck.model.Truck;
import com.truckbites.truck.model.TruckStatus;
import com.truckbites.truck.service.TruckService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Key;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TruckControllerTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A47";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TruckService truckService;

    private String vendorToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        vendorToken = createTestToken("vendor@example.com", "VENDOR");
        customerToken = createTestToken("customer@example.com", "CUSTOMER");
    }

    private String createTestToken(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(TEST_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    private Truck createTruck(Long id, String name, Long ownerId) {
        return Truck.builder()
                .id(id)
                .name(name)
                .cuisineType("Mexican")
                .description("Best tacos in town")
                .latitude(40.7128)
                .longitude(-74.0060)
                .status(TruckStatus.CLOSED)
                .ownerId(ownerId)
                .build();
    }

    // ──────────── GET /api/trucks/search (public) ────────────

    @Test
    @DisplayName("GET /api/trucks/search should return trucks list")
    void searchTrucks_shouldReturnTruckList() throws Exception {
        List<Truck> trucks = List.of(
                createTruck(1L, "Taco Truck", 1L),
                createTruck(2L, "Pizza Truck", 2L)
        );
        when(truckService.searchTrucks(any(), any(), any(), any())).thenReturn(trucks);

        mockMvc.perform(get("/api/trucks/search")
                        .param("cuisineType", "Mexican")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Taco Truck"))
                .andExpect(jsonPath("$[1].name").value("Pizza Truck"));
    }

    @Test
    @DisplayName("GET /api/trucks/search should work without filters")
    void searchTrucks_shouldWorkWithoutFilters() throws Exception {
        when(truckService.searchTrucks(any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/trucks/search")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ──────────── GET /api/trucks/{id} (public) ────────────

    @Test
    @DisplayName("GET /api/trucks/{id} should return truck")
    void getTruck_shouldReturnTruck() throws Exception {
        Truck truck = createTruck(1L, "Taco Truck", 1L);
        when(truckService.getTruckById(1L)).thenReturn(truck);

        mockMvc.perform(get("/api/trucks/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Taco Truck"));
    }

    @Test
    @DisplayName("GET /api/trucks/{id} should return 404 when not found")
    void getTruck_shouldReturn404_whenNotFound() throws Exception {
        when(truckService.getTruckById(999L))
                .thenThrow(new com.truckbites.common.exception.ResourceNotFoundException("Truck not found with id: 999"));

        mockMvc.perform(get("/api/trucks/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ──────────── POST /api/trucks (VENDOR only) ────────────

    @Test
    @DisplayName("POST /api/trucks should create truck for VENDOR")
    void createTruck_shouldCreateAndReturn201() throws Exception {
        CreateTruckRequest request = new CreateTruckRequest();
        request.setName("New Truck");
        request.setCuisineType("Italian");
        request.setDescription("Italian food");
        request.setLatitude(40.7128);
        request.setLongitude(-74.0060);

        Truck createdTruck = createTruck(1L, "New Truck", 0L);
        when(truckService.createTruck(any(CreateTruckRequest.class), anyLong())).thenReturn(createdTruck);

        mockMvc.perform(post("/api/trucks")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Truck"));
    }

    @Test
    @DisplayName("POST /api/trucks should return 403 when user is not VENDOR")
    void createTruck_shouldReturn403_whenNotVendor() throws Exception {
        CreateTruckRequest request = new CreateTruckRequest();
        request.setName("New Truck");
        request.setCuisineType("Italian");
        request.setLatitude(40.7128);
        request.setLongitude(-74.0060);

        mockMvc.perform(post("/api/trucks")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/trucks should return 400 when request is invalid")
    void createTruck_shouldReturn400_whenRequestInvalid() throws Exception {
        CreateTruckRequest request = new CreateTruckRequest();
        request.setName("");

        mockMvc.perform(post("/api/trucks")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ──────────── PUT /api/trucks/{id} ────────────

    @Test
    @DisplayName("PUT /api/trucks/{id} should update truck")
    void updateTruck_shouldUpdateAndReturn200() throws Exception {
        CreateTruckRequest request = new CreateTruckRequest();
        request.setName("Updated Truck");
        request.setCuisineType("Korean");
        request.setLatitude(37.7749);
        request.setLongitude(-122.4194);

        Truck updatedTruck = createTruck(1L, "Updated Truck", 0L);
        when(truckService.updateTruck(anyLong(), any(CreateTruckRequest.class), anyLong())).thenReturn(updatedTruck);

        mockMvc.perform(put("/api/trucks/1")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Truck"));
    }

    // ──────────── PUT /api/trucks/{id}/location ────────────

    @Test
    @DisplayName("PUT /api/trucks/{id}/location should update location")
    void updateLocation_shouldUpdateAndReturn200() throws Exception {
        UpdateLocationRequest request = new UpdateLocationRequest();
        request.setLatitude(34.0522);
        request.setLongitude(-118.2437);

        Truck updatedTruck = createTruck(1L, "Taco Truck", 0L);
        updatedTruck.setLatitude(34.0522);
        updatedTruck.setLongitude(-118.2437);

        when(truckService.updateLocation(anyLong(), any(UpdateLocationRequest.class), anyLong()))
                .thenReturn(updatedTruck);

        mockMvc.perform(put("/api/trucks/1/location")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latitude").value(34.0522))
                .andExpect(jsonPath("$.longitude").value(-118.2437));
    }

    // ──────────── DELETE /api/trucks/{id} ────────────

    @Test
    @DisplayName("DELETE /api/trucks/{id} should delete and return 204")
    void deleteTruck_shouldDeleteAndReturn204() throws Exception {
        doNothing().when(truckService).deleteTruck(anyLong(), anyLong());

        mockMvc.perform(delete("/api/trucks/1")
                        .header("Authorization", "Bearer " + vendorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
