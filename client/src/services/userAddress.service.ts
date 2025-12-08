import { userAddressApi } from "@/api/userAddress.api";
import type { UserAddress, UpdateAddressRequest } from "@/types/user.types";

export const userAddressService = {
  /**
   * Get all addresses of current logged-in user
   */
  getMyAddresses: async (): Promise<UserAddress[]> => {
    return userAddressApi.getMyAddresses();
  },

  /**
   * Get default address of current logged-in user
   */
  getMyDefaultAddress: async (): Promise<UserAddress | null> => {
    return userAddressApi.getMyDefaultAddress();
  },

  /**
   * Create new address for current logged-in user
   */
  createAddress: async (
    address: UpdateAddressRequest
  ): Promise<UserAddress> => {
    return userAddressApi.createAddress(address);
  },

  /**
   * Update address by ID
   */
  updateAddress: async (
    id: number,
    address: UpdateAddressRequest
  ): Promise<UserAddress> => {
    return userAddressApi.updateAddress(id, address);
  },

  /**
   * Delete address by ID
   */
  deleteAddress: async (id: number): Promise<void> => {
    return userAddressApi.deleteAddress(id);
  },

  /**
   * Set address as default
   */
  setDefaultAddress: async (id: number): Promise<UserAddress> => {
    return userAddressApi.setDefaultAddress(id);
  },
};
