import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import type { CategoryDTO } from "../services/category.service";
import { categoryService } from "../services/category.service";
import type { ProductDTO } from "../services/product.service";
import { productService } from "../services/product.service";
import type { PromotionDTO } from "../services/promotion.service";
import { promotionService } from "../services/promotion.service";

const { Search } = Input;
const { Option } = Select;

const Home: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAllCategories({
        page: 1,
        size: 100,
        isActive: true,
      });
      setCategories(response.result || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadPromotions = async () => {
    try {
      const activePromotions = await promotionService.getActivePromotions();
      setPromotions(activePromotions || []);
    } catch (error) {
      console.error("Failed to load promotions:", error);
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts({
        page: currentPage,
        size: pageSize,
        isActive: true,
        categoryId: selectedCategory,
        search: searchTerm || undefined,
      });
      setProducts(response.result || []);
      setTotal(response.metadata?.totalElements || 0);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, selectedCategory]);

  useEffect(() => {
    loadCategories();
    loadPromotions();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: number | undefined) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div
      style={{
        background: "var(--color-gray-100)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "24px", textAlign: "center" }}>Cửa hàng</h1>

        {promotions.length > 0 && (
          <Card
            style={{
              marginBottom: "24px",
              background:
                "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              color: "white",
            }}
          >
            <h2 style={{ color: "white", marginBottom: "16px" }}>
              Khuyến mãi đang diễn ra
            </h2>
            <Row gutter={[16, 16]}>
              {promotions.slice(0, 3).map((promo) => (
                <Col xs={24} sm={12} md={8} key={promo.id}>
                  <Card
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      color: "white",
                    }}
                  >
                    <h3 style={{ color: "white", marginBottom: "8px" }}>
                      {promo.name}
                    </h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.9)", margin: 0 }}>
                      {promo.discountType === "DISCOUNT_AMOUNT" &&
                      promo.discountAmount != null
                        ? `Giảm ${formatPrice(promo.discountAmount ?? 0)}`
                        : "Khuyến mãi áp dụng điều kiện / quà tặng"}
                    </p>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        <Card style={{ marginBottom: "24px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch("");
                  }
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Chọn danh mục"
                allowClear
                size="large"
                style={{ width: "100%" }}
                onChange={handleCategoryChange}
                value={selectedCategory}
              >
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8} style={{ textAlign: "right" }}>
              <Button
                type="default"
                size="large"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(undefined);
                  setCurrentPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading}>
          {products.length === 0 && !loading ? (
            <Empty description="Không tìm thấy sản phẩm nào" />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {products.map((product) => {
                  const basePrice = product.price ?? 0;
                  const discountPrice = product.discountPrice ?? basePrice;
                  const hasDiscount =
                    product.discountPrice != null &&
                    product.discountPrice < basePrice;

                  return (
                    <Col xs={12} sm={8} md={6} key={product.id}>
                      <Card
                        hoverable
                        cover={
                          product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0].imageUrl}
                              alt={product.name}
                              height={200}
                              style={{ objectFit: "cover" }}
                              preview={false}
                            />
                          ) : (
                            <div
                              style={{
                                height: 200,
                                background: "var(--color-gray-200)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-gray-500)",
                              }}
                            >
                              Không có ảnh
                            </div>
                          )
                        }
                        actions={[
                          <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            block
                            onClick={() => {
                              // TODO: Thêm vào giỏ hàng
                              console.log("Add to cart:", product.id);
                            }}
                          >
                            Thêm vào giỏ
                          </Button>,
                        ]}
                      >
                        <Card.Meta
                          title={
                            <div>
                              <div style={{ marginBottom: "8px" }}>
                                {product.name}
                              </div>
                              {product.brand && (
                                <Tag
                                  color="blue"
                                  style={{ marginBottom: "8px" }}
                                >
                                  {product.brand}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <div>
                              <Space
                                direction="vertical"
                                size="small"
                                style={{ width: "100%" }}
                              >
                                <div>
                                  {hasDiscount ? (
                                    <>
                                      <span
                                        style={{
                                          textDecoration: "line-through",
                                          color: "var(--color-gray-500)",
                                          marginRight: "8px",
                                        }}
                                      >
                                        {formatPrice(basePrice)}
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--color-error)",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {formatPrice(discountPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span style={{ fontWeight: "bold" }}>
                                      {formatPrice(basePrice)}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    color:
                                      (product.stockQuantity ?? 0) > 0
                                        ? "#52c41a"
                                        : "#ff4d4f",
                                  }}
                                >
                                  {(product.stockQuantity ?? 0) > 0
                                    ? `Còn ${
                                        product.stockQuantity ?? 0
                                      } sản phẩm`
                                    : "Hết hàng"}
                                </div>
                              </Space>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {total > pageSize && (
                <div style={{ marginTop: "24px", textAlign: "center" }}>
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} của ${total} sản phẩm`
                    }
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Home;
