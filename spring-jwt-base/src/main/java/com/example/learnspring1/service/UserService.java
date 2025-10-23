package com.example.learnspring1.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.learnspring1.domain.User;

public interface UserService {
    User createUser(User user, PasswordEncoder encoder);

    List<User> getAllUsers();
    
    List<User> getAllUsers(Specification<User> spec);

    Page<User> getUsersPage(Pageable pageable, Specification<User> spec);
    
    Page<User> getUsersPage(Pageable pageable);
    
    List<User> getUsersWithFilters(String role, String username, String email, Boolean isActive);

    Optional<User> getUserById(Long id);

    User getUserByEmail(String email);

    Optional<User> getUserByUsername(String username);

    List<User> getUsersByName(String name);

    User updateUser(Long id, User user);

    void deleteUser(Long id);
    
    User changePassword(Long id, String newPassword, PasswordEncoder encoder);
}
