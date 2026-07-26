package com.truckbites.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @Test
    @DisplayName("GET /api/users/profile should return profile for valid userId")
    void getProfile_shouldReturnProfile() throws Exception {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .phone("+1234567890")
                .address("123 Main St")
                .build();

        when(userService.getProfile(userId)).thenReturn(profile);

        // Act & Assert
        mockMvc.perform(get("/api/users/profile")
                        .param("userId", String.valueOf(userId))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.phone").value("+1234567890"))
                .andExpect(jsonPath("$.address").value("123 Main St"));
    }

    @Test
    @DisplayName("GET /api/users/profile should return 400 when userId is missing")
    void getProfile_shouldReturn400_whenUserIdMissing() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/users/profile should update and return profile")
    void updateProfile_shouldUpdateAndReturnProfile() throws Exception {
        // Arrange
        Long userId = 1L;
        UserProfile updatedProfile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .phone("+9876543210")
                .address("456 Oak Ave")
                .profileImageUrl("https://example.com/img.jpg")
                .build();

        when(userService.updateProfile(anyLong(), anyString(), anyString(), anyString()))
                .thenReturn(updatedProfile);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .param("userId", String.valueOf(userId))
                        .param("phone", "+9876543210")
                        .param("address", "456 Oak Ave")
                        .param("profileImageUrl", "https://example.com/img.jpg")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+9876543210"))
                .andExpect(jsonPath("$.address").value("456 Oak Ave"))
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/img.jpg"));
    }

    @Test
    @DisplayName("PUT /api/users/profile should return 400 when userId is missing")
    void updateProfile_shouldReturn400_whenUserIdMissing() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .param("phone", "+1234567890")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
