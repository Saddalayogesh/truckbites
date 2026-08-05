package com.truckbites.order.controller;

import com.truckbites.order.dto.BulkStatusUpdateRequest;
import com.truckbites.order.dto.CreateOrderRequest;
import com.truckbites.order.dto.OrderResponse;
import com.truckbites.order.dto.OrderStatusUpdateRequest;
import com.truckbites.order.model.OrderStatus;
import com.truckbites.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.truckbites.common.security.UserPrincipal;
import java.util.List;

/**
 * REST controller for order management.
 * Provides endpoints for customers to place and track orders,
 * and for vendors to manage order status.
 */
@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {

    private final OrderService orderService;

    /**
     * Place a new order (CUSTOMER only).
     * Validates each menu item via MenuServiceClient, snapshots name/price,
     * calculates total, saves with PLACED status, and publishes order.placed event.
     */
    @PostMapping
    @Operation(
            summary = "Place a new order (CUSTOMER)",
            description = "Places a new order for the authenticated customer. " +
                    "Validates each menu item (exists, available, sufficient quantity) via Menu Service, " +
                    "snapshots item names and prices at order time, calculates the total amount, " +
                    "saves with PLACED status, and publishes an order.placed event to RabbitMQ.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Order placed successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or item unavailable/insufficient quantity"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "Menu item not found"),
            @ApiResponse(responseCode = "503", description = "Menu service unavailable")
    })
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Place order: truckId={}, customerId={}", request.getTruckId(), customerId);
        OrderResponse order = orderService.placeOrder(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * Get order by ID.
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get order by ID",
            description = "Returns details of a specific order including all order items. " +
                    "Available to the order owner or the truck vendor."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order details returned",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> getOrder(
            @Parameter(description = "Order ID", example = "1") @PathVariable Long id) {
        log.info("Get order by id: {}", id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * Get all orders for the authenticated customer.
     */
    @GetMapping("/my-orders")
    @Operation(
            summary = "Get my orders (CUSTOMER)",
            description = "Returns all orders placed by the authenticated customer, " +
                    "ordered by most recent first.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of customer's orders returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Get my orders for customerId: {}", customerId);
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    /**
     * Get all orders for a specific truck.
     */
    @GetMapping("/truck/{truckId}")
    @Operation(
            summary = "Get orders for a truck (VENDOR)",
            description = "Returns all orders for a specific food truck, ordered by most recent first.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of truck orders returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires VENDOR role")
    })
    public ResponseEntity<List<OrderResponse>> getOrdersByTruck(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId) {
        log.info("Get orders for truckId: {}", truckId);
        return ResponseEntity.ok(orderService.getOrdersByTruck(truckId));
    }

    /**
     * Returns all orders in the system (ADMIN only).
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all orders (ADMIN)",
            description = "Returns all orders in the system. Restricted to ADMIN users.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of all orders returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role")
    })
    public ResponseEntity<List<OrderResponse>> getAllOrdersAdmin() {
        log.info("Get all orders (admin)");
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * Get orders for a truck filtered by status.
     */
    @GetMapping("/truck/{truckId}/status")
    @Operation(
            summary = "Get orders by truck and status (VENDOR)",
            description = "Returns orders for a specific truck filtered by order status. " +
                    "Useful for vendors to view pending orders (e.g., filter by PLACED to see new orders).",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of filtered orders returned",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid status value"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<List<OrderResponse>> getOrdersByTruckAndStatus(
            @Parameter(description = "Truck ID", example = "1") @PathVariable Long truckId,
            @Parameter(description = "Filter by order status", example = "PLACED",
                    schema = @Schema(allowableValues = {"PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"}))
            @RequestParam OrderStatus status) {
        log.info("Get orders for truckId: {}, status: {}", truckId, status);
        return ResponseEntity.ok(orderService.getOrdersByTruckAndStatus(truckId, status));
    }

    /**
     * Update order status (VENDOR only). Validates truck ownership via TruckServiceClient.
     */
    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Update order status (VENDOR only)",
            description = "Updates the status of an order. Validates that the authenticated vendor " +
                    "owns the truck associated with the order via the Truck Service. " +
                    "Typical flow: PLACED → PREPARING → READY → COMPLETED.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order status updated successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied - only VENDOR users can perform this operation"),
            @ApiResponse(responseCode = "404", description = "Order not found"),
            @ApiResponse(responseCode = "503", description = "Truck service unavailable")
    })
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @Parameter(description = "Order ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            Authentication authentication) {
        checkVendorRole(authentication);
        Long vendorId = extractUserId(authentication);
        log.info("Update order status: id={}, newStatus={}, vendorId={}",
                id, request.getStatus(), vendorId);
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request, vendorId));
    }

    /**
     * Ensures the authenticated user has the VENDOR role.
     */
    private void checkVendorRole(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isVendor = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VENDOR"));
        if (!isVendor) {
            log.warn("Non-VENDOR user attempted a vendor-only operation");
            throw new AccessDeniedException("Only VENDOR users can perform this operation");
        }
    }

    /**
     * Extracts the user ID from the Authentication principal.
     * The principal is the email (username) set by JwtValidationFilter.
     * TODO: Extract userId from JWT custom claims once added to auth-service.
     */
    @PostMapping("/bulk-status")
    @Operation(
            summary = "Bulk update order statuses (VENDOR)",
            description = "Updates the status of multiple orders at once. Validates truck ownership.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<List<OrderResponse>> bulkUpdateStatus(
            @RequestBody BulkStatusUpdateRequest request,
            Authentication authentication) {
        checkVendorRole(authentication);
        Long vendorId = extractUserId(authentication);
        log.info("Bulk update: {} orders to status {}", request.getOrderIds().size(), request.getStatus());
        OrderStatus newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        OrderStatusUpdateRequest statusRequest = new OrderStatusUpdateRequest();
        statusRequest.setStatus(newStatus);
        return ResponseEntity.ok(orderService.bulkUpdateOrderStatus(
                request.getOrderIds(), statusRequest, vendorId));
    }

    /**
     * Cancel an order (CUSTOMER only, within 60 seconds of placing).
     */
    @PostMapping("/{id}/cancel")
    @Operation(
            summary = "Cancel an order (CUSTOMER)",
            description = "Cancels an order within the 60-second cancellation window. " +
                    "Only the customer who placed the order can cancel it.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order cancelled successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Cancellation window expired or order already completed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Not your order"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderResponse> cancelOrder(
            @Parameter(description = "Order ID", example = "1") @PathVariable Long id,
            Authentication authentication) {
        Long customerId = extractUserId(authentication);
        log.info("Cancel order: id={}, customerId={}", id, customerId);
        return ResponseEntity.ok(orderService.cancelOrder(id, customerId));
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            log.debug("Authenticated user: {} (id={})", principal.email(), principal.userId());
            return principal.userId();
        }
        log.debug("Could not extract userId from authentication, defaulting to 0");
        return 0L;
    }
}
