package com.truckbites.common.security;

/**
 * Authenticated principal extracted from a JWT token.
 *
 * @param email  the user's email (JWT subject)
 * @param userId the user's ID (JWT "userId" claim)
 */
public record UserPrincipal(String email, Long userId) {
}
