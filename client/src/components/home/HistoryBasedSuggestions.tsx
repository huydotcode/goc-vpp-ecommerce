import { useHistoryBasedSuggestions, useBestSellers } from "@/hooks";
import { RightOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";

const { Title } = Typography;

interface HistoryBasedSuggestionsProps {
  limit?: number;
  categoryId?: number;
}

const HistoryBasedSuggestions: React.FC<HistoryBasedSuggestionsProps> = ({
  limit = 8,
  categoryId,
}) => {
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { data: historyData, isLoading: historyLoading, isFetching: historyFetching } = useHistoryBasedSuggestions(
    {
      limit,
      categoryId,
    },
    inView
  );

  // Fallback sang best sellers nếu history-based trả về rỗng
  const shouldShowBestSellers = !historyLoading && (!historyData || historyData.length === 0);
  const { data: bestSellersData, isLoading: bestSellersLoading } = useBestSellers(
    limit,
    inView && shouldShowBestSellers
  );

  const products = historyData && historyData.length > 0 ? historyData : (bestSellersData?.result || []);

  // Debug logging
  React.useEffect(() => {
    if (inView) {
      console.log("[HistorySuggest] Component in view, fetching suggestions...");
    }
  }, [inView]);

  React.useEffect(() => {
    if (historyData) {
      console.log("[HistorySuggest] Received history products:", historyData.length);
    }
    if (bestSellersData) {
      console.log("[HistorySuggest] Received best sellers:", bestSellersData.result?.length || 0);
    }
  }, [historyData, bestSellersData]);

  if (!inView && !historyData && !bestSellersData) {
    return <div ref={ref} className="mb-8 h-40" />;
  }

  const isLoading = historyLoading || (shouldShowBestSellers && bestSellersLoading);
  const isFetching = historyFetching;

  if (!isLoading && products.length === 0) {
    return null;
  }

  const showSkeleton = isLoading || isFetching;

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
        <div className="flex items-center gap-2">
          <ThunderboltOutlined className="text-xl text-orange-500" />
          <Title level={3} style={{ margin: "0px" }}>
            Gợi ý dành cho bạn
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
                <Col xs={12} sm={12} md={6} lg={4} key={index}>
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
              {products.slice(0, limit).map((product) => (
                <Col xs={12} sm={12} md={6} lg={4} key={product.id}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default HistoryBasedSuggestions;

