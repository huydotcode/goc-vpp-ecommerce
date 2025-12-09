package com.example.learnspring1.controller;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.ChangePasswordDTO;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me")
@Tag(name = "User Profile", description = "Hồ sơ người dùng hiện tại")
@SecurityRequirement(name = "Bearer Authentication")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    private User getCurrentUser() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        return userService.getUserByEmail(currentUserEmail);
    }

    @Operation(summary = "Đổi mật khẩu")
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordDTO request) {
        User current = getCurrentUser();
        userService.changePassword(current.getId(), request);
        return ResponseEntity.ok().build();
    }
}
