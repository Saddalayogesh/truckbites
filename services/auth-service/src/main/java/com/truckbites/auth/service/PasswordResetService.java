package com.truckbites.auth.service;

import com.truckbites.auth.model.PasswordResetToken;
import com.truckbites.auth.model.User;
import com.truckbites.auth.repository.PasswordResetTokenRepository;
import com.truckbites.auth.repository.UserRepository;
import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Generate a password reset token for the given email.
     * Returns the token as a string (in production, this would be emailed).
     */
    @Transactional
    public String forgotPassword(String email) {
        log.info("Password reset requested for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Password reset requested for unknown email: {}", email);
                    return new ResourceNotFoundException("No account found with that email address");
                });

        // Revoke any existing reset tokens for this user
        tokenRepository.deleteByUserId(user.getId());

        // Generate new token
        String token = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .used(false)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .createdAt(LocalDateTime.now())
                .build();

        tokenRepository.save(resetToken);
        log.info("Password reset token generated for userId: {}", user.getId());

        return token;
    }

    /**
     * Reset the password using a valid reset token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Password reset attempt with token");

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Invalid password reset token used");
                    return new UnauthorizedException("Invalid or expired reset token");
                });

        if (resetToken.isUsed()) {
            log.warn("Password reset token already used");
            throw new UnauthorizedException("This reset link has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Password reset token expired");
            resetToken.setUsed(true);
            tokenRepository.save(resetToken);
            throw new UnauthorizedException("Reset token has expired. Please request a new one.");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password successfully reset for userId: {}", user.getId());
    }
}
