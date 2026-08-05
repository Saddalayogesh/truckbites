package com.truckbites.auth.dto;

import com.truckbites.auth.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for updating a user's role (ADMIN only).
 */
@Data
@Schema(description = "Request to update a user's role")
public class UpdateRoleRequest {

    @NotNull(message = "Role is required")
    @Schema(description = "New role to assign", example = "VENDOR",
            allowableValues = {"CUSTOMER", "VENDOR", "ADMIN"})
    private Role role;
}
