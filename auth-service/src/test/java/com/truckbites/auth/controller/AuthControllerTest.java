package com.truckbites.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.model.Role;
import com.truckbites.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Test
    @DisplayName("POST /api/auth/register should return 201 with auth response")
    void register_shouldReturn201AndAuthResponse() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token-123")
                .email("jane@example.com")
                .name("Jane Doe")
                .role(Role.CUSTOMER)
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-token-123"))
                .andExpect(jsonPath("$.email").value("jane@example.com"))
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 400 when request is invalid")
    void register_shouldReturn400_whenRequestInvalid() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setName("");
        request.setEmail("invalid-email");
        request.setPassword("12");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login should return 200 with auth response")
    void login_shouldReturn200AndAuthResponse() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        AuthResponse mockResponse = AuthResponse.builder()
                .token("jwt-token-456")
                .email("jane@example.com")
                .name("Jane Doe")
                .role(Role.CUSTOMER)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-456"))
                .andExpect(jsonPath("$.email").value("jane@example.com"))
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 400 when request is invalid")
    void login_shouldReturn400_whenRequestInvalid() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("");
        request.setPassword("");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
