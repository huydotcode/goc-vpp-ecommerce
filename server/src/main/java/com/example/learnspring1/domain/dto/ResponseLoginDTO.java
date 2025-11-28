package com.example.learnspring1.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResponseLoginDTO {
    private String accessToken;
    private String refreshToken;

    public ResponseLoginDTO(String accessToken) {
        this.accessToken = accessToken;
    }
}
