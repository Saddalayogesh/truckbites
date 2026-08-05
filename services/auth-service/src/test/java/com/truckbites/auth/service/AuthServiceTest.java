package com.truckbites.auth.service;

import com.truckbites.auth.dto.AuthResponse;
import com.truckbites.auth.dto.LoginRequest;
import com.truckbites.auth.dto.RefreshTokenRequest;
import com.truckbites.auth.dto.RegisterRequest;
import com.truckbites.auth.model.RefreshToken;
import com.truckbites.auth.model.Role;
import com.truckbites.auth.model.User;
import com.truckbites.auth.repository.RefreshTokenRepository;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.security.JwtUtil;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, refreshTokenRepository);
    }

    private AuthResponse doRegister(RegisterRequest request) {
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .build();
        return authService.register(request);
    }

    // ──────────────── REGISTER TESTS ────────────────

    @Test
    @DisplayName("Should register a new user successfully")
    void register_shouldCreateUserAndReturnAuthResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        lenient().when(jwtUtil.generateToken(any(), any(), any())).thenReturn("test-jwt-token");
        lenient().when(jwtUtil.generateRefreshToken(any())).thenReturn("test-refresh-token");

        User savedUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.CUSTOMER)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("test-jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("test-refresh-token");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getName()).isEqualTo("John Doe");
        assertThat(response.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).existsByEmail("john@example.com");
        verify(userRepository).save(any(User.class));
        verify(jwtUtil).generateToken(eq("john@example.com"), eq("CUSTOMER"), any());
        verify(jwtUtil).generateRefreshToken("john@example.com");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when registering with existing email")
    void register_shouldThrowException_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Email already registered");

        verify(userRepository).existsByEmail("existing@example.com");
        verify(userRepository, never()).save(any());
    }

    // ──────────────── LOGIN TESTS ────────────────

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_shouldReturnAuthResponse_whenCredentialsAreValid() {
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
        lenient().when(jwtUtil.generateToken("john@example.com", "CUSTOMER", 1L)).thenReturn("test-jwt-token");
        lenient().when(jwtUtil.generateRefreshToken("john@example.com")).thenReturn("test-refresh-token");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("test-jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("test-refresh-token");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getName()).isEqualTo("John Doe");
        assertThat(response.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).findByEmail("john@example.com");
        verify(jwtUtil).generateToken("john@example.com", "CUSTOMER", 1L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when email not found")
    void login_shouldThrowException_whenEmailNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");

        verify(userRepository).findByEmail("unknown@example.com");
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when password is incorrect")
    void login_shouldThrowException_whenPasswordIsIncorrect() {
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

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");

        verify(userRepository).findByEmail("john@example.com");
    }

    // ──────────────── REFRESH TOKEN TESTS ────────────────

    @Test
    @DisplayName("Should refresh token successfully")
    void refreshToken_shouldReturnNewTokens() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-refresh-token");

        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .token("valid-refresh-token")
                .userId(1L)
                .revoked(false)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();

        User user = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .role(Role.VENDOR)
                .build();

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(storedToken));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("john@example.com", "VENDOR", 1L)).thenReturn("new-jwt-token");
        when(jwtUtil.generateRefreshToken("john@example.com")).thenReturn("new-refresh-token");

        AuthResponse response = authService.refreshToken(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("new-jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        assertThat(response.getRole()).isEqualTo(Role.VENDOR);

        // Verify old token was revoked
        assertThat(storedToken.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(storedToken);
        // Verify new token was saved
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw when refresh token not found")
    void refreshToken_shouldThrow_whenTokenNotFound() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalid-token");

        when(refreshTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    @DisplayName("Should throw when refresh token is revoked")
    void refreshToken_shouldThrow_whenTokenRevoked() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("revoked-token");

        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .token("revoked-token")
                .userId(1L)
                .revoked(true)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();

        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Refresh token has been revoked");
    }

    @Test
    @DisplayName("Should throw when refresh token is expired")
    void refreshToken_shouldThrow_whenTokenExpired() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("expired-token");

        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .token("expired-token")
                .userId(1L)
                .revoked(false)
                .expiresAt(LocalDateTime.now().minusDays(1)) // Expired yesterday
                .createdAt(LocalDateTime.now().minusDays(8))
                .build();

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Refresh token has expired");

        // Verify expired token was marked as revoked
        assertThat(storedToken.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(storedToken);
    }

    // ──────────────── LOGOUT TESTS ────────────────

    @Test
    @DisplayName("Should clear refresh tokens on logout")
    void logout_shouldDeleteRefreshTokens() {
        authService.logout(1L);

        verify(refreshTokenRepository).deleteByUserId(1L);
    }
}
