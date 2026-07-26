package com.truckbites.user.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Should return profile when userId exists")
    void getProfile_shouldReturnProfile_whenExists() {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .phone("+1234567890")
                .address("123 Main St")
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        // Act
        UserProfile result = userService.getProfile(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getPhone()).isEqualTo("+1234567890");
        assertThat(result.getAddress()).isEqualTo("123 Main St");

        verify(userProfileRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when userId not found")
    void getProfile_shouldThrowException_whenNotFound() {
        // Arrange
        Long userId = 999L;
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.getProfile(userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User profile not found for userId: " + userId);

        verify(userProfileRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("Should create a new profile")
    void createProfile_shouldCreateAndReturnProfile() {
        // Arrange
        Long userId = 2L;
        UserProfile savedProfile = UserProfile.builder()
                .id(2L)
                .userId(userId)
                .build();

        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(savedProfile);

        // Act
        UserProfile result = userService.createProfile(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getId()).isEqualTo(2L);

        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should update profile when it exists")
    void updateProfile_shouldUpdateExistingProfile() {
        // Arrange
        Long userId = 1L;
        UserProfile existingProfile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .phone("+1234567890")
                .address("Old Address")
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        UserProfile result = userService.updateProfile(userId, "+9876543210", "New Address", "https://example.com/img.jpg");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getPhone()).isEqualTo("+9876543210");
        assertThat(result.getAddress()).isEqualTo("New Address");
        assertThat(result.getProfileImageUrl()).isEqualTo("https://example.com/img.jpg");

        verify(userProfileRepository).findByUserId(userId);
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should create profile when updating non-existent profile")
    void updateProfile_shouldCreateProfile_whenNotExists() {
        // Arrange
        Long userId = 999L;
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        // createProfile saves once, then updateProfile saves again with phone set
        UserProfile savedAfterCreate = UserProfile.builder()
                .id(999L)
                .userId(userId)
                .build();
        UserProfile savedAfterUpdate = UserProfile.builder()
                .id(999L)
                .userId(userId)
                .phone("+1112223333")
                .build();

        when(userProfileRepository.save(any(UserProfile.class)))
                .thenReturn(savedAfterCreate)  // first call from createProfile
                .thenReturn(savedAfterUpdate); // second call from updateProfile

        // Act
        UserProfile result = userService.updateProfile(userId, "+1112223333", null, null);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getPhone()).isEqualTo("+1112223333");
        assertThat(result.getAddress()).isNull();

        verify(userProfileRepository).findByUserId(userId);
        verify(userProfileRepository, times(2)).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should update only provided fields")
    void updateProfile_shouldOnlyUpdateProvidedFields() {
        // Arrange
        Long userId = 1L;
        UserProfile existingProfile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .phone("+1234567890")
                .address("Old Address")
                .profileImageUrl("https://example.com/old.jpg")
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act - only update phone
        UserProfile result = userService.updateProfile(userId, "+9999999999", null, null);

        // Assert
        assertThat(result.getPhone()).isEqualTo("+9999999999");
        assertThat(result.getAddress()).isEqualTo("Old Address"); // unchanged
        assertThat(result.getProfileImageUrl()).isEqualTo("https://example.com/old.jpg"); // unchanged

        verify(userProfileRepository).findByUserId(userId);
        verify(userProfileRepository).save(any(UserProfile.class));
    }
}
