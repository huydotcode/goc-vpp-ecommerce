package com.example.learnspring1.domain.dto;

import java.time.Instant;

import com.example.learnspring1.domain.Role;
import com.example.learnspring1.domain.Gender;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String firstName;
    private String lastName;
    private String phone;
    private Gender gender;
    private LocalDate dateOfBirth;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
    private Role role;
}
