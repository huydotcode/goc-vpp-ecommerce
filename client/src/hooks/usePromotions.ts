import { promotionService } from "@/services/promotion.service";
import type {
  PromotionFilters,
  PromotionRequest,
} from "@/types/promotion.types";
import { handleApiError, showSuccess } from "@/utils/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const promotionKeys = {
  all: ["promotions"] as const,
  lists: () => [...promotionKeys.all, "list"] as const,
  list: (filters: PromotionFilters) =>
    [...promotionKeys.lists(), filters] as const,
  active: () => [...promotionKeys.all, "active"] as const,
  details: () => [...promotionKeys.all, "detail"] as const,
  detail: (id: number) => [...promotionKeys.details(), id] as const,
};

// Get all promotions with pagination and filters
export const usePromotions = (filters: PromotionFilters, enabled = true) => {
  return useQuery({
    queryKey: promotionKeys.list(filters),
    queryFn: () => promotionService.getAllPromotions(filters),
    enabled,
  });
};

// Get active promotions
export const useActivePromotions = (enabled = true) => {
  return useQuery({
    queryKey: promotionKeys.active(),
    queryFn: () => promotionService.getActivePromotions(),
    enabled,
  });
};

// Get promotion by ID
export const usePromotion = (id: number, enabled = true) => {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: () => promotionService.getPromotionById(id),
    enabled: enabled && !!id,
  });
};

// Create promotion mutation
export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionData: PromotionRequest) =>
      promotionService.createPromotion(promotionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: promotionKeys.active() });
      showSuccess("Tạo khuyến mãi thành công");
    },
    onError: handleApiError,
  });
};

// Update promotion mutation
export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromotionRequest }) =>
      promotionService.updatePromotion(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: promotionKeys.active() });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.detail(variables.id),
      });
      showSuccess("Cập nhật khuyến mãi thành công");
    },
    onError: handleApiError,
  });
};

// Upload thumbnail mutation
export const useUploadPromotionThumbnail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, promotionId }: { file: File; promotionId?: number }) =>
      promotionService.uploadThumbnail(file, promotionId),
    onSuccess: (_data, variables) => {
      if (variables.promotionId) {
        queryClient.invalidateQueries({
          queryKey: promotionKeys.detail(variables.promotionId),
        });
      }
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      showSuccess("Upload thumbnail thành công");
    },
    onError: handleApiError,
  });
};
