package com.truckbites.auth.service;

import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.model.Role;
import com.truckbites.auth.model.User;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.auth.security.JwtUtil;
import com.truckbites.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Mock
    private JwtUtil jwtUtil;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil);
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void register_shouldCreateUserAndReturnAuthResponse() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(jwtUtil.generateToken("john@example.com")).thenReturn("test-jwt-token");

        User savedUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.CUSTOMER)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("test-jwt-token");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getName()).isEqualTo("John Doe");
        assertThat(response.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).existsByEmail("john@example.com");
        verify(userRepository).save(any(User.class));
        verify(jwtUtil).generateToken("john@example.com");
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when registering with existing email")
    void register_shouldThrowException_whenEmailAlreadyExists() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Email already registered");

        verify(userRepository).existsByEmail("existing@example.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_shouldReturnAuthResponse_whenCredentialsAreValid() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("password123");

        User user = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("john@example.com")).thenReturn("test-jwt-token");

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("test-jwt-token");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getName()).isEqualTo("John Doe");
        assertThat(response.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).findByEmail("john@example.com");
        verify(jwtUtil).generateToken("john@example.com");
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when email not found")
    void login_shouldThrowException_whenEmailNotFound() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");

        verify(userRepository).findByEmail("unknown@example.com");
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when password is incorrect")
    void login_shouldThrowException_whenPasswordIsIncorrect() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("wrong-password");

        User user = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password(passwordEncoder.encode("correct-password"))
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");

        verify(userRepository).findByEmail("john@example.com");
    }
}
