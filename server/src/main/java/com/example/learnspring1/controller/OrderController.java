package com.example.learnspring1.controller;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.OrderAuditLog;
import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.BulkOrderRequest;
import com.example.learnspring1.domain.dto.BulkOrderResponse;
import com.example.learnspring1.domain.dto.CheckoutRequestDTO;
import com.example.learnspring1.domain.dto.OrderSummaryDTO;
import com.example.learnspring1.domain.dto.OrderItemSummaryDTO;
import com.example.learnspring1.domain.dto.OrderDetailDTO;
import com.example.learnspring1.repository.OrderRepository;
import com.example.learnspring1.domain.dto.OrderAuditLogDTO;
import com.example.learnspring1.service.OrderService;
import com.example.learnspring1.service.OrderAuditLogService;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.utils.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@Tag(name = "Order", description = "Quản lý đơn hàng")
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final OrderAuditLogService orderAuditLogService;

    public OrderController(
            OrderService orderService,
            OrderRepository orderRepository,
            UserService userService,
            OrderAuditLogService orderAuditLogService) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.userService = userService;
        this.orderAuditLogService = orderAuditLogService;
    }

    private User getCurrentUser() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        User user = userService.getUserByEmail(currentUserEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    @Operation(summary = "Lấy thống kê dashboard", description = "Trả về doanh thu và số đơn hàng theo ngày/tuần/tháng/tổng")
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Date ranges
        Instant todayStart = now.toLocalDate().atStartOfDay(zoneId).toInstant();
        Instant todayEnd = todayStart.plus(Duration.ofDays(1));

        Instant weekStart = now.toLocalDate().minusDays(now.getDayOfWeek().getValue() - 1).atStartOfDay(zoneId)
                .toInstant();
        Instant weekEnd = todayEnd;

        Instant monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay(zoneId).toInstant();
        Instant monthEnd = todayEnd;

        // Statistics
        Map<String, Object> stats = new HashMap<>();

        // Today
        stats.put("todayRevenue", orderRepository.sumRevenueByDateRange(todayStart, todayEnd));
        stats.put("todayOrders", orderRepository.countOrdersByDateRange(todayStart, todayEnd));

        // Week
        stats.put("weekRevenue", orderRepository.sumRevenueByDateRange(weekStart, weekEnd));
        stats.put("weekOrders", orderRepository.countOrdersByDateRange(weekStart, weekEnd));

        // Month
        stats.put("monthRevenue", orderRepository.sumRevenueByDateRange(monthStart, monthEnd));
        stats.put("monthOrders", orderRepository.countOrdersByDateRange(monthStart, monthEnd));

        // Total
        stats.put("totalRevenue", orderRepository.sumTotalRevenue());
        stats.put("totalOrders", orderRepository.countTotalOrders());
        stats.put("totalCustomers", orderRepository.countUniqueCustomers());

        // Daily sales for last 7 days
        List<Map<String, Object>> dailySales = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = now.toLocalDate().minusDays(i);
            Instant dayStart = date.atStartOfDay(zoneId).toInstant();
            Instant dayEnd = dayStart.plus(Duration.ofDays(1));

            Map<String, Object> dayStat = new HashMap<>();
            dayStat.put("date", date.format(formatter));
            dayStat.put("orders", orderRepository.countOrdersByDateRange(dayStart, dayEnd));
            dayStat.put("revenue", orderRepository.sumRevenueByDateRange(dayStart, dayEnd));
            // Count unique customers for this day - using order count as approximation
            dayStat.put("customers", orderRepository.countOrdersByDateRange(dayStart, dayEnd));

            dailySales.add(dayStat);
        }
        stats.put("dailySales", dailySales);

        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Lấy thống kê theo khoảng thời gian", description = "Trả về doanh thu và số đơn hàng trong khoảng thời gian được chọn")
    @GetMapping("/statistics/range")
    public ResponseEntity<Map<String, Object>> getStatisticsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Parse dates
        LocalDate start = LocalDate.parse(startDate, formatter);
        LocalDate end = LocalDate.parse(endDate, formatter);

        // Ensure end date is inclusive (end of day)
        Instant rangeStart = start.atStartOfDay(zoneId).toInstant();
        Instant rangeEnd = end.plusDays(1).atStartOfDay(zoneId).toInstant();

        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Statistics for the date range
        Map<String, Object> stats = new HashMap<>();

        BigDecimal rangeRevenue = orderRepository.sumRevenueByDateRange(rangeStart, rangeEnd);
        Long rangeOrders = orderRepository.countOrdersByDateRange(rangeStart, rangeEnd);

        stats.put("rangeRevenue", rangeRevenue != null ? rangeRevenue.longValue() : 0L);
        stats.put("rangeOrders", rangeOrders != null ? rangeOrders : 0L);
        stats.put("startDate", start.format(displayFormatter));
        stats.put("endDate", end.format(displayFormatter));

        // Daily sales for the selected date range
        List<Map<String, Object>> dailySales = new ArrayList<>();
        LocalDate currentDate = start;

        while (!currentDate.isAfter(end)) {
            Instant dayStart = currentDate.atStartOfDay(zoneId).toInstant();
            Instant dayEnd = dayStart.plus(Duration.ofDays(1));

            Map<String, Object> dayStat = new HashMap<>();
            dayStat.put("date", currentDate.format(displayFormatter));
            dayStat.put("orders", orderRepository.countOrdersByDateRange(dayStart, dayEnd));

            BigDecimal dayRevenue = orderRepository.sumRevenueByDateRange(dayStart, dayEnd);
            dayStat.put("revenue", dayRevenue != null ? dayRevenue.longValue() : 0L);
            dayStat.put("customers", orderRepository.countOrdersByDateRange(dayStart, dayEnd));

            dailySales.add(dayStat);
            currentDate = currentDate.plusDays(1);
        }
        stats.put("dailySales", dailySales);

        return ResponseEntity.ok(stats);
    }

    public static class CreateCODOrderRequest {
        private Long amount;
        private String description;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private String address;

        public Long getAmount() {
            return amount;
        }

        public void setAmount(Long amount) {
            this.amount = amount;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getCustomerEmail() {
            return customerEmail;
        }

        public void setCustomerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
        }

        public String getCustomerPhone() {
            return customerPhone;
        }

        public void setCustomerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }
    }

    @Operation(summary = "Checkout từ giỏ hàng", description = "Tạo đơn hàng từ giỏ hàng, trừ stock, và xóa giỏ hàng")
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@Valid @RequestBody CheckoutRequestDTO request) {
        try {
            User currentUser = getCurrentUser();
            Order order = orderService.checkoutFromCart(currentUser, request);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("paymentMethod", order.getPaymentMethod().name());
            response.put("totalAmount", order.getTotalAmount());
            response.put("message", "Order created successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/cod")
    public ResponseEntity<Map<String, Object>> createCODOrder(@RequestBody CreateCODOrderRequest request) {
        long amount = request.getAmount() != null ? request.getAmount() : 0L;
        if (amount <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Amount must be greater than 0");
            return ResponseEntity.badRequest().body(error);
        }

        String orderCode = String.valueOf(System.currentTimeMillis());
        String userEmail = SecurityUtil.getCurrentUserLogin().orElse(null);

        String description = request.getDescription() != null
                ? request.getDescription()
                : "Don hang COD";

        try {
            Order order = orderService.createOrder(
                    orderCode,
                    userEmail,
                    BigDecimal.valueOf(amount),
                    Order.PaymentMethod.COD,
                    null, // Không có paymentLinkId cho COD
                    description,
                    request.getCustomerName(),
                    request.getCustomerEmail(),
                    request.getCustomerPhone());

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("paymentMethod", order.getPaymentMethod().name());
            response.put("totalAmount", order.getTotalAmount());
            response.put("message", "Order created successfully. You will pay when receiving the order.");

            // Log để debug
            System.out.println("COD Order created: " + order.getOrderCode() + " with status: " + order.getStatus());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<?> getOrderByCode(@PathVariable String orderCode) {
        User currentUser = getCurrentUser();
        Order order = orderService.getOrderWithItemsByCode(orderCode)
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(toDetailDTO(order));
    }

    @Operation(summary = "Lấy lịch sử đơn hàng cho user", description = "Trả về timeline thay đổi của đơn hàng hiện tại của user")
    @GetMapping("/{orderCode}/history")
    public ResponseEntity<?> getMyOrderHistory(@PathVariable String orderCode) {
        try {
            User currentUser = getCurrentUser();

            // Đảm bảo user chỉ xem được lịch sử đơn hàng của chính mình
            Order order = orderService.getOrderByCode(orderCode)
                    .filter(o -> o.getUser() != null && o.getUser().getId().equals(currentUser.getId()))
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            java.util.List<OrderAuditLog> history = orderAuditLogService.getOrderHistory(order.getId());
            java.util.List<OrderAuditLogDTO> historyDTOs = orderAuditLogService.toHistoryDTOList(history);
            return ResponseEntity.ok(historyDTOs);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get order history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyOrders() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(
                orderService.getOrdersWithItemsByUserId(currentUser.getId()).stream().map(this::toSummaryDTO).toList());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<OrderSummaryDTO>> getMyOrdersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        User currentUser = getCurrentUser();
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;

        String sortField = switch (sortBy) {
            case "finalAmount", "totalAmount" -> "finalAmount";
            default -> "createdAt";
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Order> orders = orderService.getOrdersWithItemsByUserIdPaged(currentUser.getId(), status, search,
                pageable);
        Page<OrderSummaryDTO> dtoPage = orders.map(this::toSummaryDTO);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders() {
        // In a real app, verify ADMIN role here
        return ResponseEntity.ok(orderRepository.findAll().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .map(this::toSummaryDTO)
                .toList());
    }

    @Operation(summary = "Hủy đơn hàng", description = "Cho phép user hủy đơn hàng của mình (chỉ khi status là PENDING, PAID, hoặc CONFIRMED)")
    @PostMapping("/{orderCode}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable String orderCode,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            User currentUser = getCurrentUser();
            String reason = request != null ? request.get("reason") : null;

            Order order = orderService.cancelOrder(orderCode, currentUser.getId(), reason);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("message", "Đơn hàng đã được hủy thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to cancel order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    private OrderSummaryDTO toSummaryDTO(Order order) {
        OrderSummaryDTO.OrderSummaryDTOBuilder builder = OrderSummaryDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .appliedPromotions(order.getAppliedPromotions())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .items(order.getItems() != null
                        ? order.getItems().stream()
                                .map(oi -> OrderItemSummaryDTO.builder()
                                        .productId(oi.getId())
                                        .productName(oi.getProductName())
                                        .quantity(oi.getQuantity())
                                        .unitPrice(oi.getUnitPrice())
                                        .subtotal(oi.getSubtotal())
                                        .imageUrl(resolveImage(oi))
                                        .isGift(oi.getIsGift())
                                        .build())
                                .toList()
                        : java.util.Collections.emptyList());

        // Add user info if available
        if (order.getUser() != null) {
            builder.userId(order.getUser().getId())
                    .userFirstName(order.getUser().getFirstName())
                    .userLastName(order.getUser().getLastName());
        }

        return builder.build();
    }

    private OrderDetailDTO toDetailDTO(Order order) {
        OrderDetailDTO.OrderDetailDTOBuilder builder = OrderDetailDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .appliedPromotions(order.getAppliedPromotions())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .customerAddress(order.getCustomerAddress())
                .description(order.getDescription())
                .items(order.getItems() != null
                        ? order.getItems().stream()
                                .map(oi -> OrderItemSummaryDTO.builder()
                                        .productId(oi.getId())
                                        .productName(oi.getProductName())
                                        .quantity(oi.getQuantity())
                                        .unitPrice(oi.getUnitPrice())
                                        .subtotal(oi.getSubtotal())
                                        .imageUrl(resolveImage(oi))
                                        .isGift(oi.getIsGift())
                                        .build())
                                .toList()
                        : java.util.Collections.emptyList());

        // Add user info if available
        if (order.getUser() != null) {
            builder.userId(order.getUser().getId())
                    .userFirstName(order.getUser().getFirstName())
                    .userLastName(order.getUser().getLastName());
        }

        return builder.build();
    }

    private String resolveImage(com.example.learnspring1.domain.OrderItem oi) {
        if (oi.getVariant() != null && oi.getVariant().getImageUrl() != null) {
            return oi.getVariant().getImageUrl();
        }
        if (oi.getProduct() != null) {
            return oi.getProduct().getThumbnailUrl();
        }
        return null;
    }

    @PutMapping("/{orderCode}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String orderCode,
            @RequestParam String status) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            Order order = orderService.updateOrderStatus(orderCode, orderStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("message", "Order status updated successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid status: " + status);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to update order status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ========== ADMIN ENDPOINTS ==========

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Get all orders with pagination and filters")
    public ResponseEntity<Map<String, Object>> getAllOrdersAdmin(
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String customerPhone,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        // Parse dates
        Instant start = null;
        Instant end = null;
        try {
            if (startDate != null && !startDate.isEmpty()) {
                start = Instant.parse(startDate);
            }
            if (endDate != null && !endDate.isEmpty()) {
                end = Instant.parse(endDate);
            }
        } catch (Exception e) {
            // Invalid date format, ignore
        }

        Page<Order> ordersPage = orderService.getAllOrdersAdmin(
                orderCode, status, customerName, customerEmail, customerPhone, start, end, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", ordersPage.getContent().stream()
                .map(this::toSummaryDTO)
                .toList());
        response.put("currentPage", ordersPage.getNumber());
        response.put("totalItems", ordersPage.getTotalElements());
        response.put("totalPages", ordersPage.getTotalPages());
        response.put("pageSize", ordersPage.getSize());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/{orderCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Get order detail by order code")
    public ResponseEntity<?> getOrderByCodeAdmin(@PathVariable String orderCode) {
        Order order = orderService.getOrderWithItemsByCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(toDetailDTO(order));
    }

    @PutMapping("/admin/{orderCode}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Update order status")
    public ResponseEntity<Map<String, Object>> updateOrderStatusAdmin(
            @PathVariable String orderCode,
            @RequestParam String status,
            @RequestParam(required = false) String note,
            HttpServletRequest request) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            String ipAddress = getClientIpAddress(request);
            Order order = orderService.updateOrderStatus(orderCode, orderStatus, note, ipAddress);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("message", "Order status updated successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid status: " + status);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to update order status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    public static class UpdateShippingInfoRequest {
        private String customerAddress;
        private String customerPhone;

        public String getCustomerAddress() {
            return customerAddress;
        }

        public void setCustomerAddress(String customerAddress) {
            this.customerAddress = customerAddress;
        }

        public String getCustomerPhone() {
            return customerPhone;
        }

        public void setCustomerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
        }
    }

    @PutMapping("/admin/{orderCode}/shipping")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Update shipping info")
    public ResponseEntity<Map<String, Object>> updateShippingInfo(
            @PathVariable String orderCode,
            @RequestBody UpdateShippingInfoRequest body,
            HttpServletRequest request) {
        try {
            String ipAddress = getClientIpAddress(request);
            Order order = orderService.updateShippingInfo(
                    orderCode,
                    body.getCustomerAddress(),
                    body.getCustomerPhone(),
                    ipAddress);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("customerAddress", order.getCustomerAddress());
            response.put("customerPhone", order.getCustomerPhone());
            response.put("message", "Shipping info updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to update shipping info: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Get order statistics")
    public ResponseEntity<?> getOrderStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            Instant start = startDate != null ? Instant.parse(startDate) : null;
            Instant end = endDate != null ? Instant.parse(endDate) : null;

            OrderService.OrderStatistics stats = orderService.getOrderStatistics(start, end);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/admin/bulk-update")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Bulk update orders")
    public ResponseEntity<?> bulkUpdateOrders(@Valid @RequestBody BulkOrderRequest request) {
        try {
            if (request.getOrderIds() == null || request.getOrderIds().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order IDs are required"));
            }

            if (request.getAction() == null || request.getAction().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Action is required"));
            }

            BulkOrderResponse response = orderService.bulkUpdateOrders(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to perform bulk update: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/admin/{orderCode}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    @Operation(summary = "Admin: Get order history/timeline")
    public ResponseEntity<?> getOrderHistory(@PathVariable String orderCode) {
        try {
            java.util.List<OrderAuditLog> history = orderAuditLogService.getOrderHistoryByCode(orderCode);
            java.util.List<OrderAuditLogDTO> historyDTOs = orderAuditLogService.toHistoryDTOList(history);
            return ResponseEntity.ok(historyDTOs);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get order history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Helper method to get client IP address
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
