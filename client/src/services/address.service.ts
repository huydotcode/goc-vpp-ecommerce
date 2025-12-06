export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  province_code: string;
}

export interface Ward {
  code: string;
  name: string;
  district_code: string;
}

export interface AddressData {
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  fullAddress?: string;
}

// const PROVINCES_API = "https://provinces.open-api.vn/api/p/";
// const DISTRICTS_API = "https://provinces.open-api.vn/api/d/";
// const WARDS_API = "https://provinces.open-api.vn/api/w/";

const STORAGE_KEY = "last_address";

export const addressService = {
  getProvinces: async (): Promise<Province[]> => {
    try {
      const response = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  },

  getDistricts: async (provinceCode: string): Promise<District[]> => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data = await response.json();
      return data.districts || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  },

  getWards: async (districtCode: string): Promise<Ward[]> => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error("Error fetching wards:", error);
      return [];
    }
  },

  saveLastAddress: (address: AddressData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    } catch (error) {
      console.error("Error saving address to localStorage:", error);
    }
  },

  getLastAddress: (): AddressData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading address from localStorage:", error);
      return null;
    }
  },

  buildFullAddress: (address: AddressData): string => {
    const parts: string[] = [];
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    return parts.join(", ");
  },
};
