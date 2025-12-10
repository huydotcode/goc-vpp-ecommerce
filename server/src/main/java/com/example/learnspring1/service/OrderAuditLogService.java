package com.example.learnspring1.service;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.OrderAuditLogDTO;
import com.example.learnspring1.repository.OrderAuditLogRepository;
import com.example.learnspring1.repository.UserRepository;
import com.example.learnspring1.utils.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderAuditLogService {

    private final OrderAuditLogRepository orderAuditLogRepository;
    private final UserRepository userRepository;

    public OrderAuditLogService(
            OrderAuditLogRepository orderAuditLogRepository,
            UserRepository userRepository) {
        this.orderAuditLogRepository = orderAuditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Log a change to order audit log
     */
    @Transactional
    public OrderAuditLog logChange(
            Order order,
            OrderAuditLog.ChangeType changeType,
            String oldValue,
            String newValue,
            String note,
            String ipAddress) {

        // Get current user (try username first, then email)
        User currentUser = null;
        Optional<String> currentUsername = SecurityUtil.getCurrentUserLogin();
        if (currentUsername.isPresent()) {
            currentUser = userRepository.findByUsername(currentUsername.get()).orElse(null);
            if (currentUser == null) {
                currentUser = userRepository.findByEmail(currentUsername.get()).orElse(null);
            }
        }

        OrderAuditLog log = OrderAuditLog.builder()
                .order(order)
                .changedBy(currentUser)
                .changeType(changeType)
                .oldValue(oldValue)
                .newValue(newValue)
                .note(note)
                .ipAddress(ipAddress)
                .build();

        return orderAuditLogRepository.save(log);
    }

    /**
     * Log status change
     */
    @Transactional
    public OrderAuditLog logStatusChange(
            Order order,
            Order.OrderStatus oldStatus,
            Order.OrderStatus newStatus,
            String note,
            String ipAddress) {

        return logChange(
                order,
                OrderAuditLog.ChangeType.STATUS_CHANGE,
                oldStatus != null ? oldStatus.name() : null,
                newStatus.name(),
                note,
                ipAddress);
    }

    /**
     * Log order creation
     */
    @Transactional
    public OrderAuditLog logOrderCreated(Order order, String ipAddress) {
        return logChange(
                order,
                OrderAuditLog.ChangeType.ORDER_CREATED,
                null,
                order.getStatus().name(),
                "Đơn hàng được tạo",
                ipAddress);
    }

    /**
     * Log shipping info update
     */
    @Transactional
    public OrderAuditLog logShippingUpdate(
            Order order,
            String oldAddress,
            String newAddress,
            String oldPhone,
            String newPhone,
            String ipAddress) {

        StringBuilder oldValue = new StringBuilder();
        StringBuilder newValue = new StringBuilder();

        boolean addressChanged = !java.util.Objects.equals(oldAddress, newAddress);
        boolean phoneChanged = !java.util.Objects.equals(oldPhone, newPhone);

        if (addressChanged) {
            oldValue.append("Địa chỉ: ").append(oldAddress != null ? oldAddress : "N/A");
            newValue.append("Địa chỉ: ").append(newAddress != null ? newAddress : "N/A");
        }

        if (phoneChanged) {
            if (oldValue.length() > 0) {
                oldValue.append(" | ");
                newValue.append(" | ");
            }
            oldValue.append("SĐT: ").append(oldPhone != null ? oldPhone : "N/A");
            newValue.append("SĐT: ").append(newPhone != null ? newPhone : "N/A");
        }

        // Only log if something actually changed
        if (!addressChanged && !phoneChanged) {
            return null;
        }

        return logChange(
                order,
                OrderAuditLog.ChangeType.SHIPPING_UPDATE,
                oldValue.toString(),
                newValue.toString(),
                null,
                ipAddress);
    }

    /**
     * Get order history by order ID
     */
    public List<OrderAuditLog> getOrderHistory(Long orderId) {
        return orderAuditLogRepository.findByOrderIdWithUser(orderId);
    }

    /**
     * Get order history by order code
     */
    public List<OrderAuditLog> getOrderHistoryByCode(String orderCode) {
        return orderAuditLogRepository.findByOrderCodeWithUser(orderCode);
    }

    /**
     * Convert to DTO list
     */
    public List<OrderAuditLogDTO> toHistoryDTOList(List<OrderAuditLog> historyList) {
        return historyList.stream()
                .map(this::toHistoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert single history to DTO
     */
    public OrderAuditLogDTO toHistoryDTO(OrderAuditLog log) {
        OrderAuditLogDTO dto = OrderAuditLogDTO.builder()
                .id(log.getId())
                .changeType(log.getChangeType().name())
                .changeTypeLabel(getChangeTypeLabel(log.getChangeType()))
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .note(log.getNote())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();

        if (log.getChangedBy() != null) {
            User user = log.getChangedBy();
            dto.setChangedByUserId(user.getId());
            dto.setChangedByUsername(user.getUsername());

            String fullName = "";
            if (user.getFirstName() != null) {
                fullName += user.getFirstName();
            }
            if (user.getLastName() != null) {
                if (!fullName.isEmpty())
                    fullName += " ";
                fullName += user.getLastName();
            }
            dto.setChangedByName(fullName.isEmpty() ? user.getUsername() : fullName);
        }

        return dto;
    }

    /**
     * Get human-readable label for change type
     */
    private String getChangeTypeLabel(OrderAuditLog.ChangeType type) {
        return switch (type) {
            case ORDER_CREATED -> "Tạo đơn hàng";
            case STATUS_CHANGE -> "Thay đổi trạng thái";
            case SHIPPING_UPDATE -> "Cập nhật giao hàng";
            case PAYMENT_UPDATE -> "Cập nhật thanh toán";
            case NOTE_ADDED -> "Thêm ghi chú";
            case CANCELLED -> "Hủy đơn hàng";
            case REFUNDED -> "Hoàn tiền";
        };
    }
}
