import { useBestSellers } from "@/hooks";
import { RightOutlined } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";

const { Title } = Typography;

import type { PromotionResponse } from "@/types/promotion.types";

interface BestSellersProps {
  activePromotions?: PromotionResponse[];
}

const BestSellers: React.FC<BestSellersProps> = ({ activePromotions }) => {
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { data, isLoading } = useBestSellers(6, inView);

  const products = data?.result || [];

  if (!inView && !data) {
    // Placeholder để IntersectionObserver attach ref
    return <div ref={ref} className="mb-8 h-40" />;
  }

  if (!isLoading && products.length === 0) {
    return null;
  }

  const showSkeleton = isLoading;

  return (
    <motion.div
      ref={ref}
      className="mb-8 rounded-xl bg-white/80 p-3 shadow-sm backdrop-blur-sm md:p-4"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <Title level={3} style={{ margin: "0px" }}>
            Bán chạy nhất
          </Title>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:text-sm"
          onClick={() => navigate("/products")}
        >
          Xem tất cả <RightOutlined className="ml-1 text-[10px]" />
        </button>
      </div>

      {/* Content */}
      {showSkeleton ? (
        <>
          <div className="mt-3">
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col xs={24} sm={12} md={6} lg={6} key={index}>
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
              {products.slice(0, 6).map((product) => (
                <Col xs={24} sm={12} md={6} lg={6} key={product.id}>
                  <ProductCard
                    product={product}
                    activePromotions={activePromotions}
                  />
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default BestSellers;
