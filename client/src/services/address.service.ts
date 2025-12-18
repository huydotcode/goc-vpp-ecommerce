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

const STORAGE_KEY = "last_address";

// Use vapi.vnappmob.com which has CORS support
const VAPI_BASE = "https://vapi.vnappmob.com/api/v2";

export const addressService = {
  getProvinces: async (): Promise<Province[]> => {
    try {
      const response = await fetch(`${VAPI_BASE}/province/`);
      const data = await response.json();
      // Map to expected format (code, name)
      return (data.results || []).map((p: { province_id: string; province_name: string }) => ({
        code: p.province_id,
        name: p.province_name,
      }));
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  },

  getDistricts: async (provinceCode: string): Promise<District[]> => {
    try {
      const response = await fetch(
        `${VAPI_BASE}/province/district/${provinceCode}`
      );
      const data = await response.json();
      return (data.results || []).map((d: { district_id: string; district_name: string }) => ({
        code: d.district_id,
        name: d.district_name,
        province_code: provinceCode,
      }));
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  },

  getWards: async (districtCode: string): Promise<Ward[]> => {
    try {
      const response = await fetch(
        `${VAPI_BASE}/province/ward/${districtCode}`
      );
      const data = await response.json();
      return (data.results || []).map((w: { ward_id: string; ward_name: string }) => ({
        code: w.ward_id,
        name: w.ward_name,
        district_code: districtCode,
      }));
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
