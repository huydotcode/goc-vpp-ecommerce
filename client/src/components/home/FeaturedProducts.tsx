import { useProducts } from "@/hooks";
import { RightOutlined, StarFilled } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";

const { Title } = Typography;

import type { PromotionResponse } from "@/types/promotion.types";

interface FeaturedProductsProps {
  activePromotions?: PromotionResponse[];
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ activePromotions }) => {
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { data, isLoading } = useProducts(
    {
      page: 1,
      size: 6,
      isActive: true,
      isFeatured: true,
    },
    inView
  );

  const products = data?.result || [];

  const showSkeleton = !inView || isLoading;

  return (
    <motion.div
      ref={ref}
      className="mb-8 rounded-xl bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div
        className="flex flex-col items-center justify-center gap-3 md:flex-row md:items-center mb-2 py-2"
        style={{
          backgroundImage: "url(/images/san-pham-noi-bat.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex w-full justify-center items-center gap-2 rounded-md px-4 py-1 md:w-auto">
            <StarFilled
              className="text-lg text-yellow-300 md:text-xl"
              style={{
                color: "yellow",
              }}
            />
            <Title
              level={3}
              style={{
                color: "black",
                margin: 0,
              }}
            >
              Sản phẩm nổi bật
            </Title>
            <StarFilled
              className="text-lg text-yellow-300 md:text-xl"
              style={{
                color: "yellow",
              }}
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:text-sm"
            onClick={() => navigate("/products")}
          >
            Xem tất cả <RightOutlined className="ml-1 text-[10px]" />
          </button>
        </div>
      </div>

      {/* Grid desktop / tablet */}
      <div className="p-3">
        {showSkeleton ? (
          <>
            <div className="mt-3">
              <Row gutter={[16, 16]}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Col xs={12} sm={12} md={6} lg={6} key={index}>
                    <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
                  </Col>
                ))}
              </Row>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3">
              <Row gutter={[16, 16]}>
                {products.filter(p => !p.isGift).map((product) => (
                  <Col xs={12} sm={12} md={6} lg={6} key={product.id}>
                    <ProductCard product={product} activePromotions={activePromotions} />
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FeaturedProducts;
