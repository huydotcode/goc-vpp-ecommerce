package com.example.learnspring1.listener;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.learnspring1.domain.Role;
import com.example.learnspring1.domain.User;
import com.example.learnspring1.service.UserService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ApplicationStartupListener {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("=== Ứng dụng đã khởi động, kiểm tra root_admin user ===");
        
        try {
            // Kiểm tra xem user root_admin đã tồn tại chưa
            if (userService.getUserByUsername("root_admin").isEmpty()) {
                log.info("User root_admin chưa tồn tại, đang tạo mới...");
                
                // Tạo user root_admin mới
                User rootAdmin = User.builder()
                    .username("root_admin")
                    .email("root_admin@system.local")
                    .password("123123")
                    .role(Role.ADMIN)
                    .isActive(true)
                    .createdBy("system")
                    .updatedBy("system")
                    .build();
                
                // Tạo user với password đã được encode
                User createdUser = userService.createUser(rootAdmin, passwordEncoder);
                log.info("Đã tạo thành công user root_admin với ID: {}", createdUser.getId());
                
            } else {
                log.info("User root_admin đã tồn tại, bỏ qua việc tạo mới");
            }
            
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra/tạo root_admin user: {}", e.getMessage(), e);
        }
        
        log.info("=== Hoàn thành kiểm tra root_admin user ===");
    }
}
