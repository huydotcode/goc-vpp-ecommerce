import { useCart } from "@/hooks/useCart";
import { useTrackProductView } from "@/hooks/useProducts";
import type { ProductDTO } from "@/services/product.service";
import { PromotionDiscountType } from "@/types/promotion.types";
import type { ProductVariant } from "@/types/variant.types";
import { formatPrice } from "@/utils/format";
import {
  ExclamationCircleOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import VariantSelectorModal from "./VariantSelectorModal";

const { Text } = Typography;

interface BaseCardProduct {
  id: number;
  name: string;
  imageUrl?: string | null;
  originalPrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  isGift?: boolean;
  stockQuantity?: number; // THÊM: Cho promotion mode
  promotionType?: string;
  promotionDiscountAmount?: number | null;
}

import type { PromotionResponse } from "@/types/promotion.types";

interface DefaultProductCardProps {
  mode?: "default";
  product: ProductDTO;
  showNewTag?: boolean;
  activePromotions?: PromotionResponse[];
}

interface PromotionProductCardProps {
  mode: "promotion";
  product: BaseCardProduct;
  activePromotions?: never; // Not used in this mode usually, or could be
}

type ProductCardProps = DefaultProductCardProps | PromotionProductCardProps;

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const navigate = useNavigate();
  const { addItem, adding } = useCart();
  const trackProductView = useTrackProductView();
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [isBuyNowFlow, setIsBuyNowFlow] = useState(false);

  const isPromotion = props.mode === "promotion";
  const showNewTag =
    !isPromotion &&
    (props.mode === "default" || props.mode === undefined) &&
    props.showNewTag;

  const defaultVariant: ProductVariant | undefined =
    !isPromotion && props.product.variants
      ? (props.product.variants.find((v) => v.isDefault) ??
        props.product.variants[0])
      : undefined;

  const variants: ProductVariant[] =
    !isPromotion && props.product.variants ? props.product.variants : [];

  // CẢI TIẾN: Memoize baseProduct để tránh tính toán mỗi render - FIX: Proper optional chaining for images
  const baseProduct = useMemo<BaseCardProduct>(() => {
    if (isPromotion) {
      return props.product;
    }
    const defaultProps = props as DefaultProductCardProps;
    const product = defaultProps.product;

    const applicablePromotion = (defaultProps.activePromotions ?? []).find(
      (promo) =>
        !promo.conditions ||
        promo.conditions.length === 0 ||
        promo.conditions.some((c) =>
          c.details.some((d) => d.productId === product.id)
        )
    );

    const basePrice = defaultVariant?.price ?? product.price ?? 0;
    const discountedBase =
      defaultVariant?.price ?? product.discountPrice ?? product.price ?? 0;

    let finalPrice = discountedBase;
    let promotionType: string | undefined;
    let promotionDiscountAmount: number | null | undefined;

    if (
      applicablePromotion &&
      applicablePromotion.discountType ===
        PromotionDiscountType.DISCOUNT_AMOUNT &&
      (applicablePromotion.discountAmount ?? 0) > 0
    ) {
      promotionType = applicablePromotion.discountType;
      promotionDiscountAmount = applicablePromotion.discountAmount ?? 0;
      finalPrice = Math.max(0, discountedBase - (promotionDiscountAmount ?? 0));
    } else if (applicablePromotion) {
      promotionType = applicablePromotion.discountType;
      promotionDiscountAmount = applicablePromotion.discountAmount;
    }

    return {
      id: product.id,
      name: product.name,
      imageUrl:
        product.thumbnailUrl ?? product.images?.[0]?.imageUrl ?? undefined, // FIX: Safe array access with optional chaining
      originalPrice: basePrice,
      finalPrice,
      discountPercent: undefined,
      isGift: false,
      stockQuantity: undefined, // Default mode không cần
      promotionType,
      promotionDiscountAmount,
    };
  }, [isPromotion, props, defaultVariant]);

  const { id, name, imageUrl, originalPrice, finalPrice, isGift } = baseProduct;

  const handleAddWithVariant = async (afterAddCallback?: () => void) => {
    try {
      // Nếu có nhiều variant, yêu cầu chọn
      if (!isPromotion && variants.length > 1) {
        setVariantModalOpen(true);
        setIsBuyNowFlow(!!afterAddCallback); // Set flow dựa trên callback
        if (selectedVariantId == null) {
          setSelectedVariantId(defaultVariant?.id ?? variants[0]?.id ?? null);
        }
        setSelectedQty(1);
        return;
      }

      const targetVariant =
        variants.length > 0 ? (defaultVariant ?? variants[0]) : undefined;

      // Kiểm tra tồn kho trên variant
      if (targetVariant) {
        const stockQuantity = targetVariant.stockQuantity;
        if (
          stockQuantity !== null &&
          stockQuantity !== undefined &&
          stockQuantity <= 0
        ) {
          toast.warning("Sản phẩm đã hết hàng");
          return;
        }
      }

      setAddingProductId(id);
      await addItem({
        productId: id,
        variantId: targetVariant?.id ?? null,
        quantity: 1,
        productName: baseProduct.name,
        variantName: targetVariant?.variantValue ?? null,
        sku: targetVariant?.sku ?? null,
        productImageUrl: baseProduct.imageUrl ?? null,
        unitPrice: baseProduct.finalPrice ?? baseProduct.originalPrice ?? 0,
      });

      // Callback sau khi add thành công
      afterAddCallback?.();
    } finally {
      setAddingProductId(null);
    }
  };

  const handleAddToCart = () => {
    handleAddWithVariant();
  };

  const handleBuyNow = () => {
    handleAddWithVariant(() => navigate("/cart"));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Nếu đang mở modal chọn variant, không điều hướng
    if (variantModalOpen) {
      return;
    }
    // Chỉ navigate nếu không click vào button hoặc các element tương tác
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest(".ant-btn") ||
      target.closest(".ant-tag")
    ) {
      return;
    }
    // Track product view khi click vào card
    trackProductView.mutate(id, {
      onError: () => {
        // Silent fail - không hiển thị lỗi nếu track thất bại
      },
    });
    navigate(`/products/${id}`);
  };

  const handleConfirmVariant = async () => {
    if (!selectedVariantId) {
      toast.warning("Vui lòng chọn phân loại");
      return;
    }
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) {
      toast.error("Không tìm thấy phân loại");
      return;
    }
    const stockQuantity = variant.stockQuantity;
    if (
      stockQuantity !== null &&
      stockQuantity !== undefined &&
      stockQuantity < selectedQty
    ) {
      toast.warning("Phân loại này không đủ hàng");
      return;
    }
    try {
      setAddingProductId(id);
      await addItem({
        productId: id,
        variantId: variant.id ?? null,
        quantity: selectedQty,
        productName: baseProduct.name,
        variantName: variant.variantValue ?? null,
        sku: variant.sku ?? null,
        productImageUrl: baseProduct.imageUrl ?? null,
        unitPrice: baseProduct.finalPrice ?? baseProduct.originalPrice ?? 0,
      });
      setVariantModalOpen(false);
      if (isBuyNowFlow) {
        navigate("/cart");
      }
    } finally {
      setAddingProductId(null);
      setIsBuyNowFlow(false);
    }
  };

  const isAdding = adding || addingProductId === id;

  // CẢI TIẾN: Memoize isOutOfStock để tránh tính toán mỗi render
  const isOutOfStock = useMemo(() => {
    if (isPromotion) {
      // Promotion mode: Check stockQuantity từ props
      const promotionProduct = props as PromotionProductCardProps;
      return (
        promotionProduct.product.stockQuantity !== undefined &&
        promotionProduct.product.stockQuantity <= 0
      );
    }
    // Default mode: Existing logic
    const product = (props as DefaultProductCardProps).product;
    if (product.hasStock === false) {
      return true;
    }
    if (product.variants && product.variants.length > 0) {
      return !product.variants.some(
        (v) => v.isActive && (v.stockQuantity ?? 0) > 0
      );
    }
    return false;
  }, [isPromotion, props]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết sản phẩm ${name}`}
      onClick={handleCardClick}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trackProductView.mutate(id, {
            onError: () => {},
          });
          navigate(`/products/${id}`);
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-red-100 bg-white p-0 text-[13px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-primary hover:shadow-sm"
    >
      {/* Image area */}
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-md h-[300px]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[32px] font-semibold text-primary md:text-[40px]">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        {showNewTag && (
          <Tag
            color="red"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: "red",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              padding: "2px 4px",
              borderRadius: "4px",
            }}
          >
            Mới
          </Tag>
        )}

        {/* THÊM TAG HẾT HÀNG */}
        {isOutOfStock && (
          <Tag
            id={`out-of-stock-${id}`} // ID cho aria-describedby
            color="default"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
              backgroundColor: "#f5f5f5",
              color: "#999",
              border: "1px solid #d9d9d9",
              fontSize: "12px",
              fontWeight: "bold",
              padding: "4px 6px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            aria-label="Sản phẩm hết hàng"
          >
            <ExclamationCircleOutlined style={{ fontSize: "12px" }} />
            Hết hàng
          </Tag>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-1 p-2">
        <div className="flex items-start justify-between gap-1">
          <Text
            className="font-semibold"
            ellipsis={{ tooltip: name }}
            style={{ fontSize: "16px" }}
          >
            {name}
          </Text>
          <div className="flex flex-col items-end gap-1">
            {isGift && (
              <Tag
                color="red"
                className="m-0 flex items-center gap-1 border-none px-1 py-0 text-[10px]"
              >
                <GiftOutlined /> Quà tặng
              </Tag>
            )}

            {!isPromotion &&
              (props as DefaultProductCardProps).activePromotions?.map(
                (promo) => {
                  const isApplicable =
                    !promo.conditions ||
                    promo.conditions.length === 0 ||
                    promo.conditions.some((c) =>
                      c.details.some((d) => d.productId === id)
                    );
                  if (!isApplicable) return null;

                  return (
                    <Tag
                      key={promo.id}
                      color={
                        promo.discountType === "GIFT" ? "purple" : "volcano"
                      }
                      className="m-0 flex items-center gap-1 border-none px-1 py-0 text-[10px]"
                    >
                      {promo.discountType === "GIFT" ? (
                        <>
                          <GiftOutlined /> +Quà
                        </>
                      ) : (
                        "Giảm giá"
                      )}
                    </Tag>
                  );
                }
              )}

            {/* Show badge in promotion mode */}
            {isPromotion && baseProduct.promotionType && (
              <Tag
                color={
                  baseProduct.promotionType === "GIFT" ? "purple" : "volcano"
                }
                className="m-0 flex items-center gap-1 border-none px-1 py-0 text-[10px]"
              >
                {baseProduct.promotionType === "GIFT" ? (
                  <>
                    <GiftOutlined /> +Quà
                  </>
                ) : (
                  <>Giảm giá</>
                )}
              </Tag>
            )}
          </div>
        </div>

        {!isGift && originalPrice !== null && originalPrice !== undefined && (
          <>
            {/* Giá: chỉ hiển thị giá gốc, không hiển thị giá sau giảm */}
            <div className="mt-1 flex items-end justify-between gap-2 text-[12px] md:text-[13px]">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-gray-900 md:text-[16px]">
                  {formatPrice(originalPrice ?? finalPrice ?? 0)}
                </span>
              </div>
            </div>

            {/* Nút luôn hiện trên mobile, ẩn trên desktop */}
            <div className="mt-2 flex flex-col gap-2 md:hidden">
              <Button
                type="primary"
                size="middle"
                className={`w-full py-2 text-[13px] ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOutOfStock) {
                    toast.info("Sản phẩm tạm thời hết hàng");
                    return;
                  }
                  handleBuyNow();
                }}
                disabled={isAdding || isOutOfStock}
                aria-label={
                  isOutOfStock
                    ? "Sản phẩm hết hàng"
                    : "Mua sản phẩm ngay lập tức"
                }
                aria-describedby={
                  isOutOfStock ? `out-of-stock-${id}` : undefined
                }
              >
                {isOutOfStock ? "Hết hàng" : "Mua ngay"}
              </Button>

              <Button
                size="middle"
                className={`flex w-full items-center justify-center gap-1 px-3 text-[13px] ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                icon={<ShoppingCartOutlined aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOutOfStock) {
                    toast.info("Sản phẩm tạm thời hết hàng");
                    return;
                  }
                  handleAddToCart();
                }}
                aria-label={
                  isOutOfStock
                    ? "Sản phẩm hết hàng"
                    : "Thêm sản phẩm vào giỏ hàng"
                }
                aria-describedby={
                  isOutOfStock ? `out-of-stock-${id}` : undefined
                }
              >
                {isOutOfStock ? "Hết hàng" : "Thêm giỏ hàng"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Hover actions overlay */}
      {!isGift && !isOutOfStock && (
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
          <div className="pointer-events-auto flex w-full max-w-[90%] flex-col items-stretch gap-2 px-3">
            <Button
              type="primary"
              size="middle"
              className="w-full py-2 text-[13px] md:text-[14px]"
              onClick={(e) => {
                e.stopPropagation();
                handleBuyNow();
              }}
              aria-label="Mua sản phẩm ngay lập tức"
            >
              Mua ngay
            </Button>

            <Button
              size="middle"
              className="flex w-full items-center justify-center gap-1 px-3 text-[13px] md:text-[14px]"
              icon={<ShoppingCartOutlined aria-hidden />}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isAdding}
              aria-label="Thêm sản phẩm vào giỏ hàng"
            >
              Thêm giỏ hàng
            </Button>
          </div>
        </div>
      )}
      {/* Overlay out of stock */}
      {!isGift && isOutOfStock && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/50"
          aria-live="polite"
          aria-label="Sản phẩm tạm thời hết hàng"
        >
          <Tag color="default" className="text-sm font-semibold shadow-sm">
            Tạm thời hết hàng
          </Tag>
        </div>
      )}

      {/* Variant selector modal */}
      <VariantSelectorModal
        open={variantModalOpen}
        variants={variants}
        selectedVariantId={selectedVariantId}
        selectedQty={selectedQty}
        productName={name}
        fallbackImage={imageUrl}
        loading={adding || addingProductId === id}
        confirmText={isBuyNowFlow ? "Mua ngay" : "Thêm vào giỏ"}
        onClose={() => setVariantModalOpen(false)}
        onChangeVariant={(variantId) => setSelectedVariantId(variantId)}
        onChangeQty={(qty) => setSelectedQty(qty)}
        onConfirm={handleConfirmVariant}
      />
    </div>
  );
};

export default ProductCard;
