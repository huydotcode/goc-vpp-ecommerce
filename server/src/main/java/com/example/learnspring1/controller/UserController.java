package com.example.learnspring1.controller;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;


import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.UserDTO;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.domain.APIResponse;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import com.example.learnspring1.domain.CreateValidation;

@RestController
@RequestMapping("/users")
@Tag(name = "User", description = "Quản lý người dùng")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder encoder;

    public UserController(UserService userService, PasswordEncoder encoder) {
        this.userService = userService;
        this.encoder = encoder;
    }


    @Operation(summary = "Tạo mới user", description = "Tạo mới một user với thông tin hợp lệ.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tạo user thành công",
            content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
            content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @PostMapping
    public UserDTO createNewUser(@Validated(CreateValidation.class) @RequestBody User input) {
        User user = this.userService.createUser(input, encoder);
        return toDTO(user);
    }




    @Operation(summary = "Lấy user phân trang", description = "Trả về danh sách user theo phân trang.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = User.class)))
    @GetMapping("/page")
    public Page<UserDTO> getUsersPage(
            @Parameter(description = "Trang hiện tại", example = "1") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "Số lượng mỗi trang", example = "10") @RequestParam(name = "size", defaultValue = "10") int size) 
    {
        Pageable pageable = PageRequest.of(page - 1, size);
        return userService.getUsersPage(pageable).map(this::toDTO);
    }

    @Operation(summary = "Lấy user với sort và phân trang", description = "Trả về danh sách user với tính năng sort và phân trang.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = PaginatedResponseDTO.class)))
    @GetMapping("/advanced")
    public PaginatedResponseDTO<UserDTO> getUsersAdvanced(
            @Parameter(description = "Trang hiện tại", example = "1") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "Số lượng mỗi trang", example = "10") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "Trường để sort", example = "username") @RequestParam(name = "sort", defaultValue = "id") String sortField,
            @Parameter(description = "Hướng sort (asc/desc)", example = "asc") @RequestParam(name = "direction", defaultValue = "asc") String direction,
            @Parameter(description = "ID để filter", example = "1") @RequestParam(name = "id", required = false) Long id,
            @Parameter(description = "Role để filter", example = "ADMIN") @RequestParam(name = "role", required = false) String role,
            @Parameter(description = "Username để filter", example = "admin") @RequestParam(name = "username", required = false) String username,
            @Parameter(description = "Email để filter", example = "admin@example.com") @RequestParam(name = "email", required = false) String email,
            @Parameter(description = "Trạng thái active", example = "true") @RequestParam(name = "isActive", required = false) Boolean isActive,
            @Parameter(description = "Search term", example = "admin") @RequestParam(name = "search", required = false) String search) 
    {
        // Validate và normalize parameters
        page = Math.max(1, page);
        size = Math.min(Math.max(5, size), 100); // Min 5, Max 100
        
        // Validate và normalize sort field
        String[] allowedSortFields = {"id", "username", "email", "role", "createdAt", "updatedAt"};
        String validSortField = sortField;
        if (!java.util.Arrays.asList(allowedSortFields).contains(sortField)) {
            validSortField = "id"; // Default fallback
        }
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(sortDirection, validSortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        
        // Sử dụng method mới với filtering
        Page<UserDTO> userPage = userService.getUsersPageWithFilters(pageable, id, role, username, email, isActive, search).map(this::toDTO);
        
        // Tạo metadata
        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .empty(userPage.isEmpty())
                .sortField(validSortField)
                .sortDirection(direction)
                .numberOfElements(userPage.getNumberOfElements())
                .build();
        
        return PaginatedResponseDTO.<UserDTO>builder()
                .metadata(metadata)
                .result(userPage.getContent())
                .build();
    }

    @Operation(summary = "Lấy user với filter thủ công", description = "Trả về danh sách user với filter thủ công theo role.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = User.class)))
    @GetMapping("/filter")
    public List<UserDTO> getUsersByRole(
            @Parameter(description = "Role để filter", example = "ADMIN") @RequestParam(name = "role", required = false) String role,
            @Parameter(description = "Username để filter", example = "admin") @RequestParam(name = "username", required = false) String username,
            @Parameter(description = "Email để filter", example = "admin@example.com") @RequestParam(name = "email", required = false) String email,
            @Parameter(description = "Trạng thái active", example = "true") @RequestParam(name = "isActive", required = false) Boolean isActive) 
    {
        return userService.getUsersWithFilters(role, username, email, isActive).stream().map(this::toDTO).toList();
    }


    @Operation(summary = "Lấy user theo ID", description = "Trả về thông tin user theo id.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công",
            content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy user",
            content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @GetMapping("/{id}")
    public UserDTO getUserById(@Parameter(description = "ID của user", example = "1") @PathVariable("id") Long id) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id " + id));
        return toDTO(user);
    }

    @Operation(summary = "Cập nhật user", description = "Cập nhật thông tin user theo id.")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công",
        content = @Content(schema = @Schema(implementation = UserDTO.class)))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy user",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @PutMapping("/{id}")
    public UserDTO updateUser(@Parameter(description = "ID của user", example = "1") @PathVariable("id") Long id,
                              @Valid @RequestBody User user) {
        User updatedUser = userService.updateUser(id, user);
        return toDTO(updatedUser);
    }

    @Operation(summary = "Xóa user", description = "Xóa user theo id (soft delete).")
    @ApiResponse(responseCode = "200", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy user",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @DeleteMapping("/{id}")
    public void deleteUser(@Parameter(description = "ID của user", example = "1") @PathVariable("id") Long id) {
        userService.deleteUser(id);
    }






    
    

    // Chuyển User entity sang UserDTO (không trả về password)
    private UserDTO toDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .createdBy(user.getCreatedBy())
                .updatedBy(user.getUpdatedBy())
                .deletedBy(user.getDeletedBy())
                .role(user.getRole())
                .build();
    }

}
