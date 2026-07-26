package com.truckbites.user.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository userProfileRepository;

    public UserProfile getProfile(Long userId) {
        log.debug("Fetching profile for userId: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.warn("Profile not found for userId: {}", userId);
                    return new ResourceNotFoundException("User profile not found for userId: " + userId);
                });
        log.debug("Profile found for userId: {}", userId);
        return profile;
    }

    public UserProfile createProfile(Long userId) {
        log.info("Creating new profile for userId: {}", userId);
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .build();
        UserProfile saved = userProfileRepository.save(profile);
        log.debug("Profile created with id: {} for userId: {}", saved.getId(), userId);
        return saved;
    }

    public UserProfile updateProfile(Long userId, String phone, String address, String profileImageUrl) {
        log.debug("Updating profile for userId: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.debug("Profile not found for userId: {}, creating new one", userId);
                    return createProfile(userId);
                });

        if (phone != null) {
            log.debug("Setting phone for userId {}: {}", userId, phone);
            profile.setPhone(phone);
        }
        if (address != null) {
            log.debug("Setting address for userId {}: {}", userId, address);
            profile.setAddress(address);
        }
        if (profileImageUrl != null) {
            log.debug("Setting profileImageUrl for userId {}", userId);
            profile.setProfileImageUrl(profileImageUrl);
        }

        UserProfile saved = userProfileRepository.save(profile);
        log.info("Profile updated for userId: {}", userId);
        return saved;
    }
}
