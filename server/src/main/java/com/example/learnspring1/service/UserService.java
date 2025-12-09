package com.example.learnspring1.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.UpdateProfileDTO;
import com.example.learnspring1.domain.dto.ChangePasswordDTO;

public interface UserService {
    User createUser(User user, PasswordEncoder encoder);

    Page<User> getUsersPage(Pageable pageable, Specification<User> spec);

    Page<User> getUsersPage(Pageable pageable);

    Page<User> getUsersPageWithFilters(Pageable pageable, Long id, String role, String username, String email,
            Boolean isActive, String search);

    List<User> getUsersWithFilters(String role, String username, String email, Boolean isActive);

    Optional<User> getUserById(Long id);

    User getUserByEmail(String email);

    Optional<User> getUserByUsername(String username);

    User updateUser(Long id, User user);

    User updateUserProfile(Long id, UpdateProfileDTO dto);

    boolean existsByPhone(String phone);

    void changePassword(Long userId, ChangePasswordDTO dto);

    void deleteUser(Long id);

}
