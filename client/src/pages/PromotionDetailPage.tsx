import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Typography, Breadcrumb, Button, Result, Spin, Row, Col, Card, Tag, Divider } from "antd";
import { HomeOutlined, ArrowLeftOutlined, GiftOutlined, ShoppingOutlined } from "@ant-design/icons";
import { promotionService } from "@/services/promotion.service";
import type { PromotionResponse } from "@/types/promotion.types";
import ProductCard from "@/components/ProductCard";
import { PromotionDiscountType } from "@/types/promotion.types";

const { Title, Paragraph, Text } = Typography;

const PromotionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<PromotionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (slug) {
      setLoading(true);
      setError(null);
      promotionService
        .getPromotionBySlug(slug)
        .then((data) => {
          setPromotion(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading promotion:", err);
          setError("Không thể tải thông tin khuyến mãi.");
          setLoading(false);
        });
    } else {
      setError("Slug không hợp lệ.");
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 15px", textAlign: "center" }}>
        <Spin size="large" tip="Đang tải thông tin khuyến mãi..." />
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 15px" }}>
        <Result
          status="404"
          title="Không tìm thấy khuyến mãi"
          subTitle={error || "Khuyến mãi bạn tìm kiếm không tồn tại hoặc đã hết hạn."}
          extra={
            <Button type="primary" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  // Collect products from promotion
  const conditionProducts = promotion.conditions?.flatMap((condition) =>
    condition.details.map((detail) => ({
      id: detail.productId,
      name: detail.productName ?? `Sản phẩm #${detail.productId}`,
      price: detail.productPrice,
      isGift: false,
      imageUrl: detail.productThumbnailUrl ?? undefined,
      requiredQuantity: detail.requiredQuantity,
    })) ?? []
  ) ?? [];

  const giftProducts = promotion.giftItems?.map((gift) => ({
    id: gift.productId,
    name: gift.productName ?? `Quà tặng #${gift.productId}`,
    isGift: true,
    imageUrl: gift.productThumbnailUrl ?? undefined,
    quantity: gift.quantity,
  })) ?? [];

  const allProducts = [...conditionProducts, ...giftProducts];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 15px 60px" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
          { title: "Khuyến mãi" },
          { title: promotion.name.substring(0, 30) + (promotion.name.length > 30 ? "..." : "") },
        ]}
        style={{ marginBottom: 24 }}
      />

      {/* Banner Image */}
      {promotion.thumbnailUrl && (
        <div style={{ marginBottom: 32, borderRadius: 8, overflow: "hidden" }}>
          <img
            src={promotion.thumbnailUrl}
            alt={promotion.name}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}

      {/* Promotion Header */}
      <Card style={{ marginBottom: 32, borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={1} style={{ fontSize: "2rem", marginBottom: 16 }}>
            {promotion.name}
          </Title>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {promotion.discountType === PromotionDiscountType.DISCOUNT_AMOUNT && promotion.discountAmount && (
              <Tag color="red" style={{ fontSize: 16, padding: "4px 12px" }}>
                Giảm {promotion.discountAmount.toLocaleString("vi-VN")}đ
              </Tag>
            )}
            {promotion.discountType === PromotionDiscountType.GIFT && (
              <Tag color="green" style={{ fontSize: 16, padding: "4px 12px" }}>
                <GiftOutlined /> Tặng quà
              </Tag>
            )}
            {promotion.isActive ? (
              <Tag color="success">Đang áp dụng</Tag>
            ) : (
              <Tag color="default">Đã kết thúc</Tag>
            )}
          </div>
        </div>

        {promotion.description && (
          <Paragraph
            style={{
              fontSize: 16,
              fontStyle: "italic",
              borderLeft: "4px solid #C92127",
              paddingLeft: 16,
              background: "#fff6f6",
              padding: "12px 16px",
              marginBottom: 0,
            }}
          >
            {promotion.description}
          </Paragraph>
        )}
      </Card>

      {/* Products Section */}
      {allProducts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingOutlined /> Sản phẩm trong chương trình
          </Title>

          {/* Condition Products */}
          {conditionProducts.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Title level={3} style={{ fontSize: 18, marginBottom: 16 }}>
                Sản phẩm áp dụng khuyến mãi
              </Title>
              <Row gutter={[16, 16]}>
                {conditionProducts.map((product) => {
                  const originalPrice = product.price ?? null;
                  const discountAmount =
                    promotion.discountType === PromotionDiscountType.DISCOUNT_AMOUNT &&
                    promotion.discountAmount
                      ? promotion.discountAmount
                      : 0;

                  const hasDiscount =
                    originalPrice !== null && discountAmount > 0;

                  const finalPrice =
                    originalPrice !== null
                      ? Math.max(originalPrice - discountAmount, 0)
                      : null;

                  const discountPercent =
                    hasDiscount && originalPrice
                      ? Math.round((discountAmount / originalPrice) * 100)
                      : null;

                  return (
                    <Col xs={12} sm={12} md={6} lg={6} key={product.id}>
                      <ProductCard
                        mode="promotion"
                        product={{
                          id: product.id,
                          name: product.name,
                          imageUrl: product.imageUrl,
                          originalPrice,
                          finalPrice,
                          discountPercent,
                          isGift: false,
                          promotionType: promotion.discountType,
                          promotionDiscountAmount: promotion.discountAmount,
                        }}
                      />
                      {product.requiredQuantity && product.requiredQuantity > 1 && (
                        <div style={{ textAlign: "center", marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Mua từ {product.requiredQuantity} sản phẩm
                          </Text>
                        </div>
                      )}
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}

          {/* Gift Products */}
          {giftProducts.length > 0 && (
            <div>
              <Divider />
              <Title level={3} style={{ fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <GiftOutlined /> Quà tặng
              </Title>
              <Row gutter={[16, 16]}>
                {giftProducts.map((product) => (
                  <Col xs={12} sm={12} md={6} lg={6} key={product.id}>
                    <ProductCard
                      mode="promotion"
                      product={{
                        id: product.id,
                        name: product.name,
                        imageUrl: product.imageUrl,
                        originalPrice: null,
                        finalPrice: null,
                        discountPercent: null,
                        isGift: true,
                        promotionType: promotion.discountType,
                        promotionDiscountAmount: promotion.discountAmount,
                      }}
                    />
                    {product.quantity && product.quantity > 1 && (
                      <div style={{ textAlign: "center", marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Tặng {product.quantity} sản phẩm
                        </Text>
                      </div>
                    )}
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
          Về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default PromotionDetailPage;

