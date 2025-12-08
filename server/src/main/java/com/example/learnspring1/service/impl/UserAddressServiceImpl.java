package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.UserAddress;
import com.example.learnspring1.domain.dto.UpdateAddressDTO;
import com.example.learnspring1.domain.dto.UserAddressDTO;
import com.example.learnspring1.repository.UserAddressRepository;
import com.example.learnspring1.service.UserAddressService;
import com.example.learnspring1.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository userAddressRepository;
    private final UserService userService;

    public UserAddressServiceImpl(
            UserAddressRepository userAddressRepository,
            UserService userService) {
        this.userAddressRepository = userAddressRepository;
        this.userService = userService;
    }

    @Override
    public List<UserAddressDTO> getUserAddresses(String email) {
        User user = userService.getUserByEmail(email);
        List<UserAddress> addresses = userAddressRepository.findByUserId(user.getId());
        return addresses.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UserAddressDTO getDefaultAddress(String email) {
        User user = userService.getUserByEmail(email);
        return userAddressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    @Transactional
    public UserAddressDTO createAddress(String email, UpdateAddressDTO addressDTO) {
        User user = userService.getUserByEmail(email);

        // Nếu set làm default, bỏ default của các address khác
        if (Boolean.TRUE.equals(addressDTO.getIsDefault())) {
            userAddressRepository.findByUserId(user.getId()).forEach(addr -> {
                addr.setIsDefault(false);
                userAddressRepository.save(addr);
            });
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .isDefault(addressDTO.getIsDefault() != null ? addressDTO.getIsDefault() : false)
                .phone(addressDTO.getPhone())
                .provinceCode(addressDTO.getProvinceCode())
                .provinceName(addressDTO.getProvinceName())
                .districtCode(addressDTO.getDistrictCode())
                .districtName(addressDTO.getDistrictName())
                .wardCode(addressDTO.getWardCode())
                .wardName(addressDTO.getWardName())
                .street(addressDTO.getStreet())
                .fullAddress(addressDTO.getFullAddress())
                .build();

        address = userAddressRepository.save(address);
        return toDTO(address);
    }

    @Override
    @Transactional
    public UserAddressDTO updateAddress(String email, Long addressId, UpdateAddressDTO addressDTO) {
        User user = userService.getUserByEmail(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Nếu set làm default, bỏ default của các address khác
        if (Boolean.TRUE.equals(addressDTO.getIsDefault())) {
            userAddressRepository.findByUserId(user.getId()).forEach(addr -> {
                if (!addr.getId().equals(addressId)) {
                    addr.setIsDefault(false);
                    userAddressRepository.save(addr);
                }
            });
        }

        if (addressDTO.getIsDefault() != null) {
            address.setIsDefault(addressDTO.getIsDefault());
        }
        if (addressDTO.getPhone() != null) {
            address.setPhone(addressDTO.getPhone());
        }
        if (addressDTO.getProvinceCode() != null) {
            address.setProvinceCode(addressDTO.getProvinceCode());
        }
        if (addressDTO.getProvinceName() != null) {
            address.setProvinceName(addressDTO.getProvinceName());
        }
        if (addressDTO.getDistrictCode() != null) {
            address.setDistrictCode(addressDTO.getDistrictCode());
        }
        if (addressDTO.getDistrictName() != null) {
            address.setDistrictName(addressDTO.getDistrictName());
        }
        if (addressDTO.getWardCode() != null) {
            address.setWardCode(addressDTO.getWardCode());
        }
        if (addressDTO.getWardName() != null) {
            address.setWardName(addressDTO.getWardName());
        }
        if (addressDTO.getStreet() != null) {
            address.setStreet(addressDTO.getStreet());
        }
        if (addressDTO.getFullAddress() != null) {
            address.setFullAddress(addressDTO.getFullAddress());
        }

        address = userAddressRepository.save(address);
        return toDTO(address);
    }

    @Override
    @Transactional
    public void deleteAddress(String email, Long addressId) {
        User user = userService.getUserByEmail(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        userAddressRepository.delete(address);
    }

    @Override
    @Transactional
    public UserAddressDTO setDefaultAddress(String email, Long addressId) {
        User user = userService.getUserByEmail(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Bỏ default của tất cả addresses khác
        userAddressRepository.findByUserId(user.getId()).forEach(addr -> {
            addr.setIsDefault(false);
            userAddressRepository.save(addr);
        });

        // Set default cho address này
        address.setIsDefault(true);
        address = userAddressRepository.save(address);
        return toDTO(address);
    }

    private UserAddressDTO toDTO(UserAddress address) {
        return UserAddressDTO.builder()
                .id(address.getId())
                .userId(address.getUser().getId())
                .isDefault(address.getIsDefault())
                .phone(address.getPhone())
                .provinceCode(address.getProvinceCode())
                .provinceName(address.getProvinceName())
                .districtCode(address.getDistrictCode())
                .districtName(address.getDistrictName())
                .wardCode(address.getWardCode())
                .wardName(address.getWardName())
                .street(address.getStreet())
                .fullAddress(address.getFullAddress())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
