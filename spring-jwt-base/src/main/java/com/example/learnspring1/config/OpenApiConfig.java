package com.example.learnspring1.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring JWT Base API")
                        .version("1.0.0")
                        .description("""
                            API cho hệ thống quản trị: xác thực bằng OAuth2 JWT

                            ## Cách lấy Token và sử dụng cho APIs
                            1) Đăng nhập để lấy Access Token
                            - Endpoint: `POST /api/v1/auth/login`
                            - Request body (JSON):
                            {"username":"root_admin@system.local","password":"123123"}
                            - Curl:
                            curl -X POST http://localhost:8080/api/v1/auth/login \
                              -H "Content-Type: application/json" \
                              -d '{"username":"root_admin@system.local","password":"123123"}'
                            - Response (ví dụ):
                            {"status":"OK","message":"SUCCESS","data":{"accessToken":"<JWT>"}}

                            2) Dùng token cho các API khác (đặt vào Header Authorization)
                            - Header: Authorization: Bearer <JWT>

                            ### Ví dụ theo từng API
                            - Users
                              - Danh sách (có lọc/phân trang):
                                curl "http://localhost:8080/api/v1/users?page=1&size=10&sort=createdAt&direction=desc" -H "Authorization: Bearer <JWT>"
                              - Xem chi tiết:
                                curl http://localhost:8080/api/v1/users/1 -H "Authorization: Bearer <JWT>"
                              - Tạo mới:
                                curl -X POST http://localhost:8080/api/v1/users -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d '{"username":"newuser","email":"new@ex.com","password":"123456","role":"USER","isActive":true}'
                              - Cập nhật:
                                curl -X PUT http://localhost:8080/api/v1/users/1 -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d '{"username":"updated","email":"u@ex.com","role":"EMPLOYEE","isActive":true}'

                          
                            Ghi chú: Một số endpoint public (swagger-ui, api-docs) được mở tự do; các endpoint `/api/v1/**` yêu cầu Bearer JWT.
                            """)
                        .contact(new Contact()
                                .name("Truong Giang")
                                .email("truonggiang@example.com")
                                .url("https://github.com/truonggiang"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080/api/v1")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.example.com/api/v1")
                                .description("Production Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", createAPIKeyScheme()))
                .tags(List.of(
                        new Tag()
                                .name("Authentication")
                                .description("API endpoints cho authentication và authorization"),
                        new Tag()
                                .name("User")
                                .description("Quản lý người dùng với đầy đủ tính năng CRUD, pagination và filtering"),
                        new Tag()
                                .name("Category")
                                .description("Quản lý danh mục với soft delete và audit trail")
                ));
    }

    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer")
                .description("""
                    JWT Authentication
                    
                    Để sử dụng API, bạn cần:
                    1. Gọi POST /auth/login với username/password
                    2. Lấy token từ response
                    3. Thêm header: Authorization: Bearer <token>
                    
                    Token có thời hạn 24 giờ.
                    """);
    }
}
