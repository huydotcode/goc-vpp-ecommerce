import { useProducts } from "@/hooks";
import { RightOutlined } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";

const { Title } = Typography;

const NewArrivals: React.FC = () => {
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { data, isLoading } = useProducts(
    {
      page: 1,
      size: 8,
      isActive: true,
      sort: "createdAt",
      direction: "desc",
    },
    inView
  );

  const products = data?.result || [];

  if (!inView && !data) {
    // placeholder để IntersectionObserver attach ref
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
      {/* Banner New Arrivals */}
      <div className="mt-3 overflow-hidden rounded-xl">
        <img
          src="/images/banner/banner-spm.webp"
          alt="Sản phẩm mới về"
          className="h-auto w-full object-cover"
        />
      </div>

      {/* Header dưới banner */}
      <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <Title level={3} style={{ margin: "0px" }}>
            Sản phẩm mới về
          </Title>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white md:text-sm"
          onClick={() => navigate("/products?sort=newest")}
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
              {products.slice(0, 8).map((product) => (
                <Col xs={12} sm={12} md={6} lg={6} key={product.id}>
                  <ProductCard product={product} showNewTag={true} />
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default NewArrivals;
