package com.example.learnspring1.repository;

import org.springframework.stereotype.Repository;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.Role;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserRepository extends JpaRepository<User, Long> , JpaSpecificationExecutor<User> {

    List<User> findByUsernameContainingIgnoreCase(String username);

    // You can define custom query methods if needed, for example:
    // List<User> findByEmail(String email);
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // Filter by isActive
    List<User> findByIsActiveTrue();
    
    Page<User> findByIsActiveTrue(Pageable pageable);
    
    // Custom query for filtering
    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:username IS NULL OR u.username LIKE %:username%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    List<User> findUsersWithFilters(@Param("role") Role role, 
                                   @Param("username") String username, 
                                   @Param("email") String email, 
                                   @Param("isActive") Boolean isActive);

}
