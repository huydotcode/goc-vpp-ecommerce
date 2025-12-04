import { addressService } from "@/services/address.service";
import { useQuery } from "@tanstack/react-query";

// Query keys
export const addressKeys = {
  all: ["address"] as const,
  provinces: () => [...addressKeys.all, "provinces"] as const,
  districts: (provinceCode: string) =>
    [...addressKeys.all, "districts", provinceCode] as const,
  wards: (districtCode: string) =>
    [...addressKeys.all, "wards", districtCode] as const,
};

// Get provinces
export const useProvinces = (enabled = true) => {
  return useQuery({
    queryKey: addressKeys.provinces(),
    queryFn: () => addressService.getProvinces(),
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - provinces rarely change
  });
};

// Get districts by province code
export const useDistricts = (provinceCode: string, enabled = true) => {
  return useQuery({
    queryKey: addressKeys.districts(provinceCode),
    queryFn: () => addressService.getDistricts(provinceCode),
    enabled: enabled && !!provinceCode,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Get wards by district code
export const useWards = (districtCode: string, enabled = true) => {
  return useQuery({
    queryKey: addressKeys.wards(districtCode),
    queryFn: () => addressService.getWards(districtCode),
    enabled: enabled && !!districtCode,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
