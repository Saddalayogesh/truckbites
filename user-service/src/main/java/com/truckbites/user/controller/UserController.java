package com.truckbites.user.controller;

import com.truckbites.user.model.UserProfile;
import com.truckbites.user.service.UserService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfile> getProfile(@RequestParam Long userId) {
        log.info("Get profile request for userId: {}", userId);
        UserProfile profile = userService.getProfile(userId);
        log.debug("Profile retrieved for userId: {}", userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfile> updateProfile(
            @RequestParam Long userId,
            @RequestParam(required = false) @Size(max = 20) String phone,
            @RequestParam(required = false) @Size(max = 255) String address,
            @RequestParam(required = false) @Size(max = 500) String profileImageUrl
    ) {
        log.info("Update profile request for userId: {}", userId);
        UserProfile profile = userService.updateProfile(userId, phone, address, profileImageUrl);
        log.info("Profile updated successfully for userId: {}", userId);
        return ResponseEntity.ok(profile);
    }
}
