package com.example.learnspring1.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.Role;
import com.example.learnspring1.repository.UserRepository;
import com.example.learnspring1.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user, PasswordEncoder encoder) {
        // Kiểm tra trùng email
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        // Kiểm tra trùng username
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("UserName đã tồn tại");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Encode the password
        return userRepository.save(user);
    }


    @Override
    public Page<User> getUsersPage(Pageable pageable, Specification<User> spec) {
        return userRepository.findAll(spec, pageable);
    }
    
    @Override
    public Page<User> getUsersPage(Pageable pageable) {
        return userRepository.findByIsActiveTrue(pageable);
    }
    
    @Override
    public Page<User> getUsersPageWithFilters(Pageable pageable, Long id, String role, String username, String email, Boolean isActive, String search) {
        // If ID filter is provided, it takes ABSOLUTE priority - ignore all other filters
        if (id != null) {
            return userRepository.findUsersByIdOnly(String.valueOf(id), pageable);
        }
        
        // Convert role string to enum
        Role roleEnum = null;
        if (role != null && !role.trim().isEmpty()) {
            try {
                roleEnum = Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore filter
            }
        }
        
        // Build dynamic query with filters
        return userRepository.findUsersWithFiltersPaged(roleEnum, username, email, isActive, search, pageable);
    }
    
    @Override
    public List<User> getUsersWithFilters(String role, String username, String email, Boolean isActive) {
        Role roleEnum = null;
        if (role != null && !role.trim().isEmpty()) {
            try {
                roleEnum = Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore filter
            }
        }
        return userRepository.findUsersWithFilters(roleEnum, username, email, isActive);
    }

    @Override
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }


    @Override
    public User updateUser(Long id, User user) {
        return userRepository.findById(id).map(existing -> {
            existing.setUsername(user.getUsername());
            existing.setEmail(user.getEmail());
            existing.setRole(user.getRole());
            existing.setIsActive(user.getIsActive());
            
            // Cập nhật password nếu có (và không null/empty)
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                existing.setPassword(passwordEncoder.encode(user.getPassword()));
            }
            
            if (user.getAvatarUrl() != null) {
                existing.setAvatarUrl(user.getAvatarUrl());
            }
            return userRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("User not found with id " + id));
        user.softDelete();
        userRepository.save(user);
    }

    @Override
    public User getUserByEmail(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            return (User) user.get();
        }
        throw new RuntimeException("User not found with email " + email);
    }

    @Override
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }


}