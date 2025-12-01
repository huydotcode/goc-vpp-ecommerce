/**
 * Upload types
 */

export type ResourceType = "image" | "video" | "raw";

export interface UploadRequest {
  file: File;
  resourceType?: ResourceType;
  module?: string;
  entityId?: string;
  purpose?: string;
}

export interface UploadResponse {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null; // for video (seconds)
  folder: string;
  originalFilename: string;
  etag: string;
}

