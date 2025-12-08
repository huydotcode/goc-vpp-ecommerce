package com.example.learnspring1.controller;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.dto.UpdateAddressDTO;
import com.example.learnspring1.domain.dto.UserAddressDTO;
import com.example.learnspring1.service.UserAddressService;
import com.example.learnspring1.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-addresses")
@Tag(name = "User Address", description = "Quản lý địa chỉ người dùng")
@SecurityRequirement(name = "Bearer Authentication")
public class UserAddressController {

    private final UserAddressService userAddressService;

    public UserAddressController(UserAddressService userAddressService) {
        this.userAddressService = userAddressService;
    }

    @Operation(summary = "Lấy danh sách địa chỉ của user hiện tại", description = "Trả về tất cả địa chỉ của user đang đăng nhập.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<List<UserAddressDTO>> getMyAddresses() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        List<UserAddressDTO> addresses = userAddressService.getUserAddresses(currentUserEmail);
        return ResponseEntity.ok(addresses);
    }

    @Operation(summary = "Lấy địa chỉ mặc định của user hiện tại", description = "Trả về địa chỉ mặc định của user đang đăng nhập.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy địa chỉ mặc định", content = @Content(schema = @Schema(implementation = APIResponse.class))),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @GetMapping("/me/default")
    public ResponseEntity<UserAddressDTO> getMyDefaultAddress() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        UserAddressDTO address = userAddressService.getDefaultAddress(currentUserEmail);
        if (address == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(address);
    }

    @Operation(summary = "Tạo địa chỉ mới", description = "Tạo địa chỉ mới cho user hiện tại.")
    @ApiResponse(responseCode = "200", description = "Tạo thành công", content = @Content(schema = @Schema(implementation = UserAddressDTO.class)))
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @PostMapping("/me")
    public ResponseEntity<UserAddressDTO> createAddress(@Valid @RequestBody UpdateAddressDTO addressDTO) {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        UserAddressDTO address = userAddressService.createAddress(currentUserEmail, addressDTO);
        return ResponseEntity.ok(address);
    }

    @Operation(summary = "Cập nhật địa chỉ", description = "Cập nhật thông tin địa chỉ theo ID.")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công", content = @Content(schema = @Schema(implementation = UserAddressDTO.class)))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy địa chỉ", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @PutMapping("/me/{id}")
    public ResponseEntity<UserAddressDTO> updateAddress(
            @Parameter(description = "ID của địa chỉ", example = "1") @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAddressDTO addressDTO) {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        UserAddressDTO address = userAddressService.updateAddress(currentUserEmail, id, addressDTO);
        return ResponseEntity.ok(address);
    }

    @Operation(summary = "Xóa địa chỉ", description = "Xóa địa chỉ theo ID.")
    @ApiResponse(responseCode = "200", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy địa chỉ", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @DeleteMapping("/me/{id}")
    public ResponseEntity<Void> deleteAddress(
            @Parameter(description = "ID của địa chỉ", example = "1") @PathVariable("id") Long id) {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        userAddressService.deleteAddress(currentUserEmail, id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Đặt địa chỉ làm mặc định", description = "Đặt địa chỉ theo ID làm địa chỉ mặc định.")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công", content = @Content(schema = @Schema(implementation = UserAddressDTO.class)))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy địa chỉ", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @ApiResponse(responseCode = "401", description = "Chưa đăng nhập", content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @PutMapping("/me/{id}/set-default")
    public ResponseEntity<UserAddressDTO> setDefaultAddress(
            @Parameter(description = "ID của địa chỉ", example = "1") @PathVariable("id") Long id) {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        UserAddressDTO address = userAddressService.setDefaultAddress(currentUserEmail, id);
        return ResponseEntity.ok(address);
    }
}
