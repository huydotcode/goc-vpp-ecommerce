export enum VariantType {
  COLOR = "COLOR",
  SIZE = "SIZE",
  MATERIAL = "MATERIAL",
  STYLE = "STYLE",
  PATTERN = "PATTERN",
  CAPACITY = "CAPACITY",
  WEIGHT = "WEIGHT",
  PACKAGE = "PACKAGE",
  OTHER = "OTHER",
}

export const VariantTypeLabels: Record<VariantType, string> = {
  [VariantType.COLOR]: "Màu sắc",
  [VariantType.SIZE]: "Kích thước",
  [VariantType.MATERIAL]: "Chất liệu",
  [VariantType.STYLE]: "Kiểu dáng",
  [VariantType.PATTERN]: "Họa tiết",
  [VariantType.CAPACITY]: "Dung tích",
  [VariantType.WEIGHT]: "Trọng lượng",
  [VariantType.PACKAGE]: "Đóng gói",
  [VariantType.OTHER]: "Khác",
};

export interface ProductVariant {
  id?: number;
  productId: number;
  productName?: string;
  variantType: VariantType;
  variantValue: string;
  colorCode?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  sku?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface CreateVariantRequest {
  productId: number;
  variantType: VariantType;
  variantValue: string;
  colorCode?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  sku?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

export interface UpdateVariantRequest {
  productId?: number;
  variantType?: VariantType;
  variantValue?: string;
  colorCode?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  sku?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

export interface VariantFilters {
  productId?: number;
  variantType?: VariantType;
  isActive?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

