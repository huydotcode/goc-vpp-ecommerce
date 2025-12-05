import type { ProductDTO } from "@/services/product.service";
import { formatPrice } from "@/utils/format";
import { GiftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

interface BaseCardProduct {
  id: number;
  name: string;
  imageUrl?: string | null;
  originalPrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  isGift?: boolean;
}

interface DefaultProductCardProps {
  mode?: "default";
  product: ProductDTO;
  showNewTag?: boolean;
}

interface PromotionProductCardProps {
  mode: "promotion";
  product: BaseCardProduct;
}

type ProductCardProps = DefaultProductCardProps | PromotionProductCardProps;

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const navigate = useNavigate();

  const isPromotion = props.mode === "promotion";
  const showNewTag =
    !isPromotion &&
    (props.mode === "default" || props.mode === undefined) &&
    props.showNewTag;

  const baseProduct: BaseCardProduct = isPromotion
    ? props.product
    : {
        id: props.product.id,
        name: props.product.name,
        imageUrl:
          props.product.thumbnailUrl ??
          (props.product.images && props.product.images.length > 0
            ? props.product.images[0].imageUrl
            : undefined),
        originalPrice: props.product.price ?? 0,
        finalPrice: props.product.discountPrice ?? props.product.price ?? 0,
        discountPercent: undefined, // sẽ tính lại bên dưới
        isGift: false,
      };

  const {
    id,
    name,
    imageUrl,
    originalPrice,
    finalPrice,
    discountPercent: inputDiscountPercent,
    isGift,
  } = baseProduct;

  const computedBasePrice = originalPrice ?? 0;
  const computedFinalPrice = finalPrice ?? computedBasePrice;

  const hasDiscount =
    !isGift && computedFinalPrice < computedBasePrice && computedBasePrice > 0;

  const discountPercent =
    inputDiscountPercent ??
    (hasDiscount
      ? Math.round(
          ((computedBasePrice - computedFinalPrice) / computedBasePrice) * 100
        )
      : null);

  const handleAddToCart = () => {
    console.log("Add to cart:", id);
  };

  const handleBuyNow = () => {
    navigate(`/products/${id}`);
  };

  return (
    <div className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-red-100 bg-white p-0 text-[13px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-primary hover:shadow-sm">
      {/* Image area */}
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-md">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
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
          {isGift && (
            <Tag
              color="red"
              className="m-0 flex items-center gap-1 border-none px-1 py-0 text-[9px]"
            >
              <GiftOutlined /> Quà tặng
            </Tag>
          )}
        </div>

        {!isGift && originalPrice !== null && originalPrice !== undefined && (
          <>
            {/* Giá + % giảm */}
            <div className="mt-1 flex items-end justify-between gap-2 text-[12px] md:text-[13px]">
              <div className="flex flex-col">
                {hasDiscount && (
                  <span className="text-[11px] text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="text-[15px] font-semibold text-red-600 md:text-[16px]">
                  {formatPrice(finalPrice ?? originalPrice)}
                </span>
              </div>

              {hasDiscount && discountPercent !== null && (
                <Tag
                  color="red"
                  className="m-0 px-2 py-0 text-[10px] font-semibold"
                >
                  -{discountPercent}%
                </Tag>
              )}
            </div>

            {/* Nút luôn hiện trên mobile, ẩn trên desktop */}
            <div className="mt-2 flex flex-col gap-2 md:hidden">
              <Button
                type="primary"
                size="middle"
                className="w-full py-2 text-[13px]"
                onClick={handleBuyNow}
              >
                Mua ngay
              </Button>

              <Button
                size="middle"
                className="flex w-full items-center justify-center gap-1 px-3 text-[13px]"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
              >
                Thêm giỏ hàng
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Hover actions overlay - chỉ desktop */}
      {!isGift && (
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
          <div className="pointer-events-auto flex w-full max-w-[90%] flex-col items-stretch gap-2 px-3">
            <Button
              type="primary"
              size="middle"
              className="w-full py-2 text-[13px] md:text-[14px]"
              onClick={handleBuyNow}
            >
              Mua ngay
            </Button>

            <Button
              size="middle"
              className="flex w-full items-center justify-center gap-1 px-3 text-[13px] md:text-[14px]"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
            >
              Thêm giỏ hàng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
