import type { UserAddress, UpdateAddressRequest } from "@/types/user.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const userAddressApi = {
  /**
   * Get all addresses of current logged-in user
   */
  getMyAddresses: async (): Promise<UserAddress[]> => {
    const response = await apiClient.get<UserAddress[]>(
      `${API_ENDPOINTS.USER_ADDRESSES}/me`
    );
    return response.data;
  },

  /**
   * Get default address of current logged-in user
   */
  getMyDefaultAddress: async (): Promise<UserAddress | null> => {
    try {
      const response = await apiClient.get<UserAddress>(
        `${API_ENDPOINTS.USER_ADDRESSES}/me/default`
      );
      return response.data;
    } catch (error: unknown) {
      const errorObj = error as { response?: { status?: number } };
      if (errorObj?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create new address for current logged-in user
   */
  createAddress: async (
    address: UpdateAddressRequest
  ): Promise<UserAddress> => {
    const response = await apiClient.post<UserAddress>(
      `${API_ENDPOINTS.USER_ADDRESSES}/me`,
      address
    );
    return response.data;
  },

  /**
   * Update address by ID
   */
  updateAddress: async (
    id: number,
    address: UpdateAddressRequest
  ): Promise<UserAddress> => {
    const response = await apiClient.put<UserAddress>(
      `${API_ENDPOINTS.USER_ADDRESSES}/me/${id}`,
      address
    );
    return response.data;
  },

  /**
   * Delete address by ID
   */
  deleteAddress: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.USER_ADDRESSES}/me/${id}`);
  },

  /**
   * Set address as default
   */
  setDefaultAddress: async (id: number): Promise<UserAddress> => {
    const response = await apiClient.put<UserAddress>(
      `${API_ENDPOINTS.USER_ADDRESSES}/me/${id}/set-default`
    );
    return response.data;
  },
};
