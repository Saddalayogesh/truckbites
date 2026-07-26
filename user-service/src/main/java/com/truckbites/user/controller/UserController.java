package com.truckbites.user.controller;

import com.truckbites.user.model.UserProfile;
import com.truckbites.user.service.UserService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfile> getProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfile> updateProfile(
            @RequestParam Long userId,
            @RequestParam(required = false) @Size(max = 20) String phone,
            @RequestParam(required = false) @Size(max = 255) String address,
            @RequestParam(required = false) @Size(max = 500) String profileImageUrl
    ) {
        return ResponseEntity.ok(userService.updateProfile(userId, phone, address, profileImageUrl));
    }
}
