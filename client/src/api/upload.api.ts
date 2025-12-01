import type { ApiResponse } from "@/types/common.types";
import type { UploadResponse, ResourceType } from "@/types/upload.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const uploadApi = {
  /**
   * Upload file to Cloudinary
   * @param file - File to upload
   * @param resourceType - Type of resource: "image", "video", or "raw"
   * @param module - Module name (e.g., "users", "categories", "products")
   * @param entityId - Entity ID (optional)
   * @param purpose - Purpose of upload (e.g., "avatar", "thumbnail")
   */
  upload: async (
    file: File,
    resourceType: ResourceType = "image",
    module: string = "shared",
    entityId?: string,
    purpose: string = "file"
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resourceType", resourceType);
    formData.append("module", module);
    if (entityId) {
      formData.append("entityId", entityId);
    }
    formData.append("purpose", purpose);

    const response = await apiClient.post<ApiResponse<UploadResponse>>(
      API_ENDPOINTS.UPLOADS,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("upload response", response);

    // Interceptor đã unwrap, response là ApiResponse<UploadResponse>
    return (response as unknown as ApiResponse<UploadResponse>).data!;
  },
};
