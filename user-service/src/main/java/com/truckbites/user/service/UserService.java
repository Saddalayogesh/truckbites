package com.truckbites.user.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository userProfileRepository;

    public UserProfile getProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId));
    }

    public UserProfile createProfile(Long userId) {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .build();
        return userProfileRepository.save(profile);
    }

    public UserProfile updateProfile(Long userId, String phone, String address, String profileImageUrl) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> createProfile(userId));

        if (phone != null) {
            profile.setPhone(phone);
        }
        if (address != null) {
            profile.setAddress(address);
        }
        if (profileImageUrl != null) {
            profile.setProfileImageUrl(profileImageUrl);
        }

        return userProfileRepository.save(profile);
    }
}
