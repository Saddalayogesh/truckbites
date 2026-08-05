package com.truckbites.user.service;

import com.truckbites.common.exception.BadRequestException;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.payment.RazorpayPaymentVerifier;
import com.truckbites.user.model.MembershipTier;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.model.VendorPlan;
import com.truckbites.user.payment.RazorpayOrderAmountVerifier;
import com.truckbites.user.repository.UserProfileRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final String TEST_KEY_SECRET = "test_key_secret";
    private static final String ORDER_ID = "order_test123";
    private static final String PAYMENT_ID = "pay_test123";
    private static final String VALID_SIGNATURE =
            RazorpayPaymentVerifier.sign(TEST_KEY_SECRET, ORDER_ID, PAYMENT_ID);

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private RazorpayOrderAmountVerifier razorpayOrderAmountVerifier;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(userService, "razorpayKeySecret", TEST_KEY_SECRET);
    }

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
    @DisplayName("Should cancel an active membership back to NONE")
    void cancelMembership_shouldRevertToNone() {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .membershipTier(MembershipTier.GOLD)
                .membershipExpiresAt(LocalDateTime.now().plusMonths(1))
                .membershipCouponsRemaining(2)
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        var result = userService.cancelMembership(userId);

        // Assert
        assertThat(result.getTier()).isEqualTo("NONE");
        assertThat(result.getDisplayName()).isEqualTo("Non-Member");
        assertThat(result.isActive()).isFalse();
        assertThat(result.getExpiresAt()).isNull();
        assertThat(profile.getMembershipCouponsRemaining()).isZero();
        assertThat(profile.getMembershipTier()).isEqualTo(MembershipTier.NONE);
        assertThat(profile.getMembershipExpiresAt()).isNull();

        verify(userProfileRepository).findByUserId(userId);
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should cancel an active vendor plan back to FREE")
    void cancelVendorPlan_shouldRevertToFree() {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .vendorPlan(VendorPlan.PRO)
                .vendorPlanExpiresAt(LocalDateTime.now().plusMonths(1))
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        var result = userService.cancelVendorPlan(userId);

        // Assert
        assertThat(result.getPlan()).isEqualTo("FREE");
        assertThat(result.getDisplayName()).isEqualTo("Free");
        assertThat(result.isActive()).isFalse();
        assertThat(result.getExpiresAt()).isNull();
        assertThat(result.getCommissionPercent()).isEqualTo(10);
        assertThat(profile.getVendorPlan()).isEqualTo(VendorPlan.FREE);
        assertThat(profile.getVendorPlanExpiresAt()).isNull();

        verify(userProfileRepository).findByUserId(userId);
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should activate membership when a valid Razorpay signature is provided")
    void subscribeMembership_shouldActivate_whenSignatureValid() {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .membershipTier(MembershipTier.NONE)
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(razorpayOrderAmountVerifier.matches(ORDER_ID, 9900L)).thenReturn(true);

        // Act
        var result = userService.subscribeMembership(userId, MembershipTier.GOLD, ORDER_ID, PAYMENT_ID, VALID_SIGNATURE);

        // Assert
        assertThat(result.getTier()).isEqualTo("GOLD");
        assertThat(result.isActive()).isTrue();
        assertThat(profile.getMembershipTier()).isEqualTo(MembershipTier.GOLD);
        assertThat(profile.getMembershipExpiresAt()).isNotNull();

        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should reject membership subscription when signature is missing or invalid")
    void subscribeMembership_shouldReject_whenSignatureInvalid() {
        // Arrange
        Long userId = 1L;

        // Act & Assert
        assertThatThrownBy(() -> userService.subscribeMembership(userId, MembershipTier.GOLD, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Payment could not be verified");
        assertThatThrownBy(() -> userService.subscribeMembership(
                userId, MembershipTier.GOLD, ORDER_ID, PAYMENT_ID, "not-a-valid-signature"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Payment could not be verified");

        verify(userProfileRepository, never()).findByUserId(any());
        verify(userProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should activate vendor plan when a valid Razorpay signature is provided")
    void subscribeVendorPlan_shouldActivate_whenSignatureValid() {
        // Arrange
        Long userId = 1L;
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(userId)
                .vendorPlan(VendorPlan.FREE)
                .build();

        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(razorpayOrderAmountVerifier.matches(ORDER_ID, 99900L)).thenReturn(true);

        // Act
        var result = userService.subscribeVendorPlan(userId, VendorPlan.PRO, ORDER_ID, PAYMENT_ID, VALID_SIGNATURE);

        // Assert
        assertThat(result.getPlan()).isEqualTo("PRO");
        assertThat(result.isActive()).isTrue();
        assertThat(profile.getVendorPlan()).isEqualTo(VendorPlan.PRO);
        assertThat(profile.getVendorPlanExpiresAt()).isNotNull();

        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Should reject vendor plan subscription when signature is missing or invalid")
    void subscribeVendorPlan_shouldReject_whenSignatureInvalid() {
        // Arrange
        Long userId = 1L;

        // Act & Assert
        assertThatThrownBy(() -> userService.subscribeVendorPlan(userId, VendorPlan.PRO, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Payment could not be verified");
        assertThatThrownBy(() -> userService.subscribeVendorPlan(
                userId, VendorPlan.PRO, ORDER_ID, PAYMENT_ID, "not-a-valid-signature"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Payment could not be verified");

        verify(userProfileRepository, never()).findByUserId(any());
        verify(userProfileRepository, never()).save(any());
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
