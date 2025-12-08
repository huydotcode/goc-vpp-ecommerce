import { useProductVectorSuggestions, useCategoriesFilter } from "@/hooks";
import { SearchOutlined, ExperimentOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, Tag, Typography, Alert } from "antd";
import { motion } from "framer-motion";
import React, { useState } from "react";
import ProductCard from "../ProductCard";

const { Title, Text } = Typography;

const AISearchTest: React.FC = () => {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const { data: categories } = useCategoriesFilter({ isActive: true }, true);

  const { data, isLoading, isError, error } = useProductVectorSuggestions(
    { q: searchQuery, categoryId, limit: 8 },
    searchQuery.length > 0
  );

  const products = data || [];

  const handleSearch = () => {
    if (query.trim().length > 0) {
      setSearchQuery(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const quickQueries = [
    "bút văn phòng",
    "màu vẽ",
    "chuột máy tính",
    "sổ ghi chép",
    "balo học sinh",
  ];

  return (
    <motion.div
      className="mb-8 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 shadow-md md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <ExperimentOutlined className="text-xl" />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Test AI Gợi Ý Sản Phẩm
            </Title>
            <Text type="secondary">
              Tìm kiếm thông minh với Gemini + ChromaDB
            </Text>
          </div>
        </div>
        <Tag color="orange">Beta</Tag>
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <Space.Compact style={{ width: "100%" }}>
          <Input
            size="large"
            placeholder="Nhập từ khóa tìm kiếm (vd: bút, màu vẽ, chuột máy tính...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            prefix={<SearchOutlined className="text-gray-400" />}
            style={{ flex: 1 }}
          />
          <Select
            size="large"
            placeholder="Tất cả danh mục"
            allowClear
            value={categoryId}
            onChange={setCategoryId}
            style={{ width: 200 }}
            options={categories?.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
          <Button
            type="primary"
            size="large"
            icon={isLoading ? <LoadingOutlined /> : <SearchOutlined />}
            onClick={handleSearch}
            loading={isLoading}
            disabled={query.trim().length === 0}
          >
            Tìm kiếm
          </Button>
        </Space.Compact>
      </div>

      {/* Quick Search Tags */}
      <div className="mb-4">
        <Text type="secondary" className="text-xs">
          Thử nhanh:
        </Text>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickQueries.map((q) => (
            <Tag
              key={q}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => {
                setQuery(q);
                setSearchQuery(q);
                setCategoryId(undefined); // Reset category khi click quick query
              }}
              color={searchQuery === q && !categoryId ? "orange" : "default"}
            >
              {q}
            </Tag>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <Alert
          message="Lỗi tìm kiếm"
          description={
            error instanceof Error
              ? error.message
              : "Không thể tìm kiếm. Vui lòng thử lại sau."
          }
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Results */}
      {searchQuery && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <Text strong>
              Kết quả cho: &quot;{searchQuery}&quot;
              {categoryId && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Danh mục: {categories?.find((c) => c.id === categoryId)?.name || categoryId})
                </span>
              )}
              {products.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  - {products.length} sản phẩm
                </span>
              )}
            </Text>
          </div>

          {isLoading ? (
            <div className="mt-4">
              <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Col xs={12} sm={12} md={6} lg={4} key={index}>
                    <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
                  </Col>
                ))}
              </Row>
            </div>
          ) : products.length > 0 ? (
            <div className="mt-2">
              <Row gutter={[16, 16]}>
                {products.map((product) => (
                  <Col xs={12} sm={12} md={6} lg={4} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <Alert
              message="Không tìm thấy sản phẩm"
              description="Thử với từ khóa khác hoặc kiểm tra ChromaDB đã được index chưa."
              type="info"
              showIcon
              className="mt-4"
            />
          )}
        </div>
      )}

      {/* Info */}
      {!searchQuery && (
        <Alert
          message="Hướng dẫn"
          description={
            <ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
              <li>Nhập từ khóa để tìm kiếm sản phẩm bằng AI</li>
              <li>Hệ thống sử dụng Gemini để tạo embeddings và ChromaDB để tìm kiếm</li>
              <li>Click vào các tag phía trên để thử nhanh</li>
            </ul>
          }
          type="info"
          showIcon
          className="mt-4"
        />
      )}
    </motion.div>
  );
};

export default AISearchTest;

