package com.truckbites.user.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.common.payment.PaymentVerification;
import com.truckbites.user.dto.MembershipResponse;
import com.truckbites.user.dto.VendorPlanResponse;
import com.truckbites.user.model.MembershipTier;
import com.truckbites.user.model.UserProfile;
import com.truckbites.user.model.VendorPlan;
import com.truckbites.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    /**
     * Returns the customer's membership status and benefits.
     * Degrades gracefully to NONE (non-member) when no profile exists.
     */
    public MembershipResponse getMembership(Long userId) {
        log.debug("Fetching membership for userId: {}", userId);
        UserProfile profile = getOrCreateProfile(userId);
        return toMembershipResponse(profile);
    }

    /**
     * Activates (or upgrades) a membership tier for one month.
     * Renewing an already-active tier extends from the current expiry date.
     * The plan only activates once the customer's UPI payment is verified via
     * the supplied transaction reference (UTR).
     */
    @Transactional
    public MembershipResponse subscribeMembership(Long userId, MembershipTier tier, String transactionRef) {
        PaymentVerification.requireValidUtr(transactionRef);
        log.info("Subscribing userId={} to membership tier {}", userId, tier);
        UserProfile profile = getOrCreateProfile(userId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = (profile.getMembershipTier() == tier
                && profile.getMembershipExpiresAt() != null
                && profile.getMembershipExpiresAt().isAfter(now))
                ? profile.getMembershipExpiresAt()
                : now;

        profile.setMembershipTier(tier);
        profile.setMembershipExpiresAt(base.plusMonths(1));
        profile.setMembershipCouponsRemaining(tier.getFreeCouponsPerMonth());
        UserProfile saved = userProfileRepository.save(profile);
        log.info("Membership activated for userId={}: tier={}, expires={}",
                userId, tier, saved.getMembershipExpiresAt());
        return toMembershipResponse(saved);
    }

    /**
     * Immediately cancels the user's membership, reverting to NONE (non-member).
     */
    @Transactional
    public MembershipResponse cancelMembership(Long userId) {
        log.info("Cancelling membership for userId={}", userId);
        UserProfile profile = getOrCreateProfile(userId);
        profile.setMembershipTier(MembershipTier.NONE);
        profile.setMembershipExpiresAt(null);
        profile.setMembershipCouponsRemaining(0);
        UserProfile saved = userProfileRepository.save(profile);
        log.info("Membership cancelled for userId={}: tier=NONE", userId);
        return toMembershipResponse(saved);
    }

    /**
     * Returns the vendor's subscription plan and commission rate.
     * Degrades gracefully to FREE when no profile exists.
     */
    public VendorPlanResponse getVendorPlan(Long userId) {
        log.debug("Fetching vendor plan for userId: {}", userId);
        UserProfile profile = getOrCreateProfile(userId);
        return toVendorPlanResponse(profile);
    }
    /**
     * Activates (or upgrades) a vendor subscription plan for one month.
     * Renewing an already-active plan extends from the current expiry date.
     * The plan only activates once the vendor's UPI payment is verified via
     * the supplied transaction reference (UTR).
     */
    @Transactional
    public VendorPlanResponse subscribeVendorPlan(Long userId, VendorPlan plan, String transactionRef) {
        PaymentVerification.requireValidUtr(transactionRef);
        log.info("Subscribing userId={} to vendor plan {}", userId, plan);
        UserProfile profile = getOrCreateProfile(userId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = (profile.getVendorPlan() == plan
                && profile.getVendorPlanExpiresAt() != null
                && profile.getVendorPlanExpiresAt().isAfter(now))
                ? profile.getVendorPlanExpiresAt()
                : now;

        profile.setVendorPlan(plan);
        profile.setVendorPlanExpiresAt(base.plusMonths(1));
        UserProfile saved = userProfileRepository.save(profile);
        log.info("Vendor plan activated for userId={}: plan={}, expires={}",
                userId, plan, saved.getVendorPlanExpiresAt());
        return toVendorPlanResponse(saved);
    }

    /**
     * Immediately cancels the vendor's paid plan, reverting to FREE.
     */
    @Transactional
    public VendorPlanResponse cancelVendorPlan(Long userId) {
        log.info("Cancelling vendor plan for userId={}", userId);
        UserProfile profile = getOrCreateProfile(userId);
        profile.setVendorPlan(VendorPlan.FREE);
        profile.setVendorPlanExpiresAt(null);
        UserProfile saved = userProfileRepository.save(profile);
        log.info("Vendor plan cancelled for userId={}: plan=FREE", userId);
        return toVendorPlanResponse(saved);
    }

    private UserProfile getOrCreateProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseGet(() -> createProfile(userId));
    }

    private MembershipResponse toMembershipResponse(UserProfile profile) {
        MembershipTier tier = profile.getMembershipTier() != null ? profile.getMembershipTier() : MembershipTier.NONE;
        LocalDateTime expiresAt = profile.getMembershipExpiresAt();
        boolean active = expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
        if (!active) {
            tier = MembershipTier.NONE;
        }
        return MembershipResponse.builder()
                .tier(tier.name())
                .displayName(tier.getDisplayName())
                .active(active)
                .monthlyPrice(tier.getMonthlyPrice())
                .platformFeePerOrder(tier.getPlatformFeePerOrder())
                .discountPercent(tier.getDiscountPercent())
                .freeCouponsPerMonth(tier.getFreeCouponsPerMonth())
                .couponsRemaining(active ? profile.getMembershipCouponsRemaining() : 0)
                .priorityProcessing(tier.isPriorityProcessing())
                .expiresAt(active ? expiresAt : null)
                .build();
    }

    private VendorPlanResponse toVendorPlanResponse(UserProfile profile) {
        VendorPlan plan = profile.getVendorPlan() != null ? profile.getVendorPlan() : VendorPlan.FREE;
        LocalDateTime expiresAt = profile.getVendorPlanExpiresAt();
        boolean active = expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
        if (!active) {
            plan = VendorPlan.FREE;
        }
        return VendorPlanResponse.builder()
                .plan(plan.name())
                .displayName(plan.getDisplayName())
                .active(active)
                .monthlyPrice(plan.getMonthlyPrice())
                .commissionPercent(plan.getCommissionPercent())
                .benefits(plan.getBenefits())
                .expiresAt(active ? expiresAt : null)
                .build();
    }
}
