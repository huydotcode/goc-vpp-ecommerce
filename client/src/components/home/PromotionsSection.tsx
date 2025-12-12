import ProductCard from "@/components/ProductCard";
import { useActivePromotions } from "@/hooks";
import type {
  PromotionConditionDetailResponse,
  PromotionGiftItemResponse,
  PromotionResponse,
} from "@/types/promotion.types";
import { Col, Row, Typography } from "antd";
import { motion } from "framer-motion";
import React, { useMemo } from "react";
import { useInView } from "react-intersection-observer";

const { Text } = Typography;

interface PromotionProductItem {
  id: number;
  name: string;
  price?: number | null;
  isGift?: boolean;
  imageUrl?: string | null;
}

const collectProductsFromPromotion = (
  promo: PromotionResponse
): PromotionProductItem[] => {
  const conditionProducts: PromotionProductItem[] =
    promo.conditions?.flatMap((condition) =>
      condition.details.map((detail: PromotionConditionDetailResponse) => ({
        id: detail.productId,
        name: detail.productName ?? `Sản phẩm #${detail.productId}`,
        price: detail.productPrice,
        isGift: false,
        imageUrl: detail.productThumbnailUrl ?? undefined,
      }))
    ) ?? [];

  const giftProducts: PromotionProductItem[] =
    promo.giftItems?.map((gift: PromotionGiftItemResponse) => ({
      id: gift.productId,
      name: gift.productName ?? `Quà tặng #${gift.productId}`,
      isGift: true,
      imageUrl: gift.productThumbnailUrl ?? undefined,
    })) ?? [];

  // Gộp và loại bỏ trùng theo id + isGift
  const map = new Map<string, PromotionProductItem>();
  [...conditionProducts, ...giftProducts].forEach((p) => {
    const key = `${p.id}-${p.isGift ? "gift" : "discount"}`;
    if (!map.has(key)) {
      map.set(key, p);
    }
  });

  return Array.from(map.values());
};

const PromotionsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { data: promotions, isLoading } = useActivePromotions(inView);

  const promotionsWithProducts = useMemo(() => {
    if (!promotions) return [];
    return promotions.map((promo) => ({
      promo,
      products: collectProductsFromPromotion(promo),
    }));
  }, [promotions]);

  if (!inView && !promotions) {
    return <div ref={ref} className="mb-8 h-40" />;
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      className="mb-8 bg-secondary rounded-xl"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Tiêu đề chung cho khuyến mãi với background pattern icon mờ (CSS trong component) */}
      <div className="relative overflow-hidden rounded-xl  py-4 px-3 md:px-6">
        {/* Layer pattern icon mờ */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("/images/bg-dcht-white.png")',
            backgroundRepeat: "repeat",
            backgroundSize: "260px 200px",
          }}
        />

        {/* Nội dung title */}
        <div className="relative z-10 text-center">
          <h2 className="text-[32px] font-extrabold italic uppercase tracking-[0.25em] text-white drop-shadow-sm md:text-[60px]">
            Ưu đãi ngập tràn
          </h2>
          <p className="mt-1 text-sm text-white/90 md:text-base">
            Săn deal sốc, mua là có quà – áp dụng cho số lượng có hạn.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-4 py-4 px-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-xl bg-white/80 p-4 shadow-sm"
            >
              <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((__, i) => (
                  <div
                    key={i}
                    className="h-40 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        promotionsWithProducts.map(({ promo, products }) => (
          <div
            key={promo.id}
            className="border-none bg-white shadow-md py-4 px-6 rounded-xl"
          >
            <div className="space-y-3">
              {/* Ảnh banner full width */}
              {promo.thumbnailUrl && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={promo.thumbnailUrl}
                    alt={promo.name}
                    className="w-full object-cover"
                  />
                </div>
              )}

              {/* Danh sách sản phẩm trong chương trình */}
              {products.length > 0 ? (
                <Row gutter={[16, 16]} className="mt-2">
                  {products
                    .filter((p) => !p.isGift)
                    .slice(0, 8)
                    .map((product) => {
                      const originalPrice = product.price ?? null;
                      const discountAmount =
                        !product.isGift &&
                        promo.discountType === "DISCOUNT_AMOUNT" &&
                        promo.discountAmount
                          ? promo.discountAmount
                          : 0;

                      const hasDiscount =
                        !product.isGift &&
                        originalPrice !== null &&
                        discountAmount > 0;

                      const finalPrice =
                        originalPrice !== null
                          ? Math.max(originalPrice - discountAmount, 0)
                          : null;

                      const discountPercent =
                        hasDiscount && originalPrice
                          ? Math.round((discountAmount / originalPrice) * 100)
                          : null;

                      return (
                        <Col
                          xs={12}
                          sm={12}
                          md={6}
                          lg={6}
                          key={`${product.id}-${product.isGift}`}
                        >
                          <ProductCard
                            mode="promotion"
                            product={{
                              id: product.id,
                              name: product.name,
                              imageUrl: product.imageUrl,
                              originalPrice,
                              finalPrice,
                              discountPercent,
                              isGift: product.isGift,
                              promotionType: promo.discountType, // Pass promotion type for badge
                              promotionDiscountAmount: promo.discountAmount,
                            }}
                          />
                        </Col>
                      );
                    })}
                </Row>
              ) : (
                <Text className="text-xs text-gray-500">
                  Chương trình áp dụng theo điều kiện đặc biệt. Vui lòng xem chi
                  tiết khi thanh toán.
                </Text>
              )}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default PromotionsSection;
