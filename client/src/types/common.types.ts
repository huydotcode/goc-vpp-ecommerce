export interface Metadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sortField?: string;
  sortDirection?: string;
  numberOfElements?: number;
}

export interface PaginatedResponse<T> {
  metadata: Metadata;
  result: T[];
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T | null;
  errors: string[] | null;
}
