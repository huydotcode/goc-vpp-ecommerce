package com.example.learnspring1.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;
import com.example.learnspring1.domain.Gender;
import java.time.LocalDate;

@Data
public class UpdateProfileDTO {
    @NotBlank(message = "Username không được để trống")
    private String username;

    private String email;

    private String password; // optional
    private String avatarUrl; // optional

    private String firstName;
    private String lastName;
    private String phone;
    private Gender gender;

    @PastOrPresent(message = "Ngày sinh không hợp lệ")
    private LocalDate dateOfBirth;
}
