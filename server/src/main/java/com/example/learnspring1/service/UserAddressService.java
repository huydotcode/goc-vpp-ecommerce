package com.example.learnspring1.service;

import com.example.learnspring1.domain.UserAddress;
import com.example.learnspring1.domain.dto.UpdateAddressDTO;
import com.example.learnspring1.domain.dto.UserAddressDTO;

import java.util.List;

public interface UserAddressService {
    List<UserAddressDTO> getUserAddresses(String email);
    
    UserAddressDTO getDefaultAddress(String email);
    
    UserAddressDTO createAddress(String email, UpdateAddressDTO addressDTO);
    
    UserAddressDTO updateAddress(String email, Long addressId, UpdateAddressDTO addressDTO);
    
    void deleteAddress(String email, Long addressId);
    
    UserAddressDTO setDefaultAddress(String email, Long addressId);
}

