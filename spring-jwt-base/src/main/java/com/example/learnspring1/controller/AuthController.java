package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.dto.LoginDTO;
import com.example.learnspring1.domain.dto.ResponseLoginDTO;
import com.example.learnspring1.utils.SecurityUtil;

import jakarta.validation.Valid;

@RestController
@Tag(name = "Authentication", description = "API xác thực và đăng nhập")
public class AuthController {

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityUtil securityUtil;

    public AuthController(AuthenticationManagerBuilder authenticationManagerBuilder, SecurityUtil securityUtil) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
    }

    @Operation(summary = "Đăng nhập", description = "Đăng nhập để lấy JWT access token")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công",
            content = @Content(schema = @Schema(implementation = ResponseLoginDTO.class))),
        @ApiResponse(responseCode = "401", description = "Username hoặc password không đúng",
            content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @PostMapping("/login")
    public ResponseLoginDTO login(@Valid @RequestBody LoginDTO loginDTO) {
        Authentication authentication = authenticationManagerBuilder.getObject()
                .authenticate(new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword()));

        String accessToken = this.securityUtil.createToken(authentication);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        return new ResponseLoginDTO(accessToken);
    }

}
