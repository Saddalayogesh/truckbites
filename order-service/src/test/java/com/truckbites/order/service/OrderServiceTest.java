package com.truckbites.order.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.order.client.MenuItemDto;
import com.truckbites.order.client.MenuServiceClient;
import com.truckbites.order.client.TruckDto;
import com.truckbites.order.client.TruckServiceClient;
import com.truckbites.order.client.UserMembershipDto;
import com.truckbites.order.client.UserServiceClient;
import com.truckbites.order.dto.CreateOrderRequest;
import com.truckbites.order.dto.OrderResponse;
import com.truckbites.order.dto.OrderStatusUpdateRequest;
import com.truckbites.order.event.OrderEventPublisher;
import com.truckbites.order.model.Order;
import com.truckbites.order.model.OrderItem;
import com.truckbites.order.model.OrderStatus;
import com.truckbites.order.repository.OrderRepository;
import feign.FeignException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private MenuServiceClient menuServiceClient;
    @Mock
    private TruckServiceClient truckServiceClient;
    @Mock
    private OrderEventPublisher eventPublisher;
    @Mock
    private UserServiceClient userServiceClient;

    @Captor
    private ArgumentCaptor<Order> orderCaptor;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, menuServiceClient, truckServiceClient, userServiceClient, eventPublisher);
    }

    private MenuItemDto createMenuItem(Long id, String name, BigDecimal price, int quantity, boolean available) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(id);
        dto.setName(name);
        dto.setPrice(price);
        dto.setQuantityAvailable(quantity);
        dto.setIsAvailable(available);
        return dto;
    }

    private TruckDto createTruckDto(Long id, Long ownerId) {
        TruckDto dto = new TruckDto();
        dto.setId(id);
        dto.setOwnerId(ownerId);
        return dto;
    }

    @Test
    @DisplayName("Should place order successfully")
    void placeOrder_shouldCreateAndReturnOrder() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerEmail("customer@example.com");
        request.setTruckId(1L);
        CreateOrderRequest.OrderItemRequest itemReq = new CreateOrderRequest.OrderItemRequest();
        itemReq.setMenuItemId(1L);
        itemReq.setQuantity(2);
        request.setItems(List.of(itemReq));

        MenuItemDto menuItem = createMenuItem(1L, "Taco", BigDecimal.valueOf(3.99), 10, true);
        when(menuServiceClient.getMenuItemById(1L)).thenReturn(menuItem);

        // Non-member: no discount, no platform fee (GST 5% on food subtotal still applies)
        UserMembershipDto membership = UserMembershipDto.builder()
                .tier("NONE")
                .active(true)
                .platformFeePerOrder(BigDecimal.ZERO)
                .discountPercent(0)
                .priorityProcessing(false)
                .build();
        when(userServiceClient.getMembership(1L)).thenReturn(membership);

        // Return the order as built by the service so computed pricing fields are preserved
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.placeOrder(1L, request);

        assertThat(response).isNotNull();
        // subtotal 7.98 + 5% GST (0.40) = 8.38 for a non-member with no platform fee
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(7.98));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(8.38));
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PLACED);
        verify(menuServiceClient).getMenuItemById(1L);
        verify(userServiceClient).getMembership(1L);
        verify(orderRepository).save(any(Order.class));
        verify(eventPublisher).publishOrderPlaced(any());
    }

    @Test
    @DisplayName("Should throw when menu item is not available")
    void placeOrder_shouldThrowWhenItemUnavailable() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerEmail("customer@example.com");
        request.setTruckId(1L);
        CreateOrderRequest.OrderItemRequest itemReq = new CreateOrderRequest.OrderItemRequest();
        itemReq.setMenuItemId(1L);
        itemReq.setQuantity(1);
        request.setItems(List.of(itemReq));

        MenuItemDto menuItem = createMenuItem(1L, "Taco", BigDecimal.valueOf(3.99), 0, false);
        when(menuServiceClient.getMenuItemById(1L)).thenReturn(menuItem);

        assertThatThrownBy(() -> orderService.placeOrder(1L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not available");
        verify(eventPublisher, never()).publishOrderPlaced(any());
    }

    @Test
    @DisplayName("Should throw when insufficient quantity")
    void placeOrder_shouldThrowWhenInsufficientQuantity() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerEmail("customer@example.com");
        request.setTruckId(1L);
        CreateOrderRequest.OrderItemRequest itemReq = new CreateOrderRequest.OrderItemRequest();
        itemReq.setMenuItemId(1L);
        itemReq.setQuantity(20);
        request.setItems(List.of(itemReq));

        MenuItemDto menuItem = createMenuItem(1L, "Taco", BigDecimal.valueOf(3.99), 5, true);
        when(menuServiceClient.getMenuItemById(1L)).thenReturn(menuItem);

        assertThatThrownBy(() -> orderService.placeOrder(1L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient quantity");
        verify(eventPublisher, never()).publishOrderPlaced(any());
    }

    @Test
    @DisplayName("Should return order by ID")
    void getOrderById_shouldReturnOrder() {
        Order order = Order.builder()
                .id(1L)
                .customerId(1L)
                .customerEmail("c@example.com")
                .truckId(1L)
                .totalAmount(BigDecimal.TEN)
                .status(OrderStatus.PLACED)
                .items(List.of())
                .build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderById(1L);
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Should throw when order not found")
    void getOrderById_shouldThrowWhenNotFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> orderService.getOrderById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should return orders by customer")
    void getOrdersByCustomer_shouldReturnOrders() {
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        List<OrderResponse> orders = orderService.getOrdersByCustomer(1L);
        assertThat(orders).isEmpty();
    }

    @Test
    @DisplayName("Should update order status after validating truck ownership")
    void updateOrderStatus_shouldUpdateStatus() {
        Order order = Order.builder()
                .id(1L)
                .customerId(1L)
                .truckId(10L)
                .totalAmount(BigDecimal.TEN)
                .status(OrderStatus.PLACED)
                .items(List.of())
                .build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(truckServiceClient.getTruckById(10L)).thenReturn(createTruckDto(10L, 42L));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderStatusUpdateRequest updateReq = new OrderStatusUpdateRequest();
        updateReq.setStatus(OrderStatus.PREPARING);

        OrderResponse response = orderService.updateOrderStatus(1L, updateReq, 42L);
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    @DisplayName("Should throw when vendor does not own the truck")
    void updateOrderStatus_shouldThrowWhenNotOwner() {
        Order order = Order.builder()
                .id(1L)
                .customerId(1L)
                .truckId(10L)
                .totalAmount(BigDecimal.TEN)
                .status(OrderStatus.PLACED)
                .items(List.of())
                .build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(truckServiceClient.getTruckById(10L)).thenReturn(createTruckDto(10L, 99L));

        OrderStatusUpdateRequest updateReq = new OrderStatusUpdateRequest();
        updateReq.setStatus(OrderStatus.PREPARING);

        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, updateReq, 42L))
                .isInstanceOf(com.truckbites.common.exception.UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should return orders by truck and status")
    void getOrdersByTruckAndStatus_shouldReturnFiltered() {
        when(orderRepository.findByTruckIdAndStatusOrderByCreatedAtAsc(1L, OrderStatus.PLACED))
                .thenReturn(List.of());
        List<OrderResponse> orders = orderService.getOrdersByTruckAndStatus(1L, OrderStatus.PLACED);
        assertThat(orders).isEmpty();
    }

    @Test
    @DisplayName("Should return all orders for admin")
    void getAllOrders_shouldReturnAll() {
        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        List<OrderResponse> orders = orderService.getAllOrders();
        assertThat(orders).isEmpty();
    }
}
