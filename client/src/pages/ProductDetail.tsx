import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Typography,
  Button,
  Rate,
  InputNumber,
  Divider,
  Card,
  Spin,
  message,
  Tabs,
  Tag,
  Breadcrumb,
  List,
  Avatar,
  Table,
} from "antd";
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CarOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { productService } from "@/services/product.service";
import { cartService } from "@/services/cart.service";
import type { Product } from "@/types/product.types";

const { Title, Text, Paragraph } = Typography;

const NextArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", right: "-10px", zIndex: 1 }}
      onClick={onClick}
    />
  );
};

const PrevArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", left: "-10px", zIndex: 1 }}
      onClick={onClick}
    />
  );
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const productSliderSettings = {
    customPaging: function (i: number) {
      const images = getProductImages();
      return (
        <a href="#">
          <img
            src={images[i]}
            alt="thumb"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
          />
        </a>
      );
    },
    dots: true,
    dotsClass: "slick-dots slick-thumb",
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
  };

  const relatedSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 600, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(Number(id));
        setProduct(data);

        productService.trackProductView(Number(id)).catch(console.error);

        if (data.categories && data.categories.length > 0) {
          const mainCategoryId = data.categories[0].id;

          const suggestionParams = {
            categoryId: mainCategoryId,
            limit: 10
          };

          const suggestions = await productService.getSuggestions(suggestionParams);

          if (suggestions) {
            setSimilarProducts(suggestions.filter((p) => p.id !== Number(id)));
          }
        } else {
             const fallback = await productService.getProductsPage({ page: 1, size: 6 });
             setSimilarProducts(fallback.result.filter((p) => p.id !== Number(id)));
        }

      } catch (error) {
        console.error("Failed to fetch product", error);
        message.error("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const getProductImages = () => {
    if (!product) return [];
    const list = [];
    if (product.thumbnailUrl) list.push(product.thumbnailUrl);
    if (product.images && product.images.length > 0) {
        const sortedImages = [...product.images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        sortedImages.forEach((img) => list.push(img.imageUrl));
    }
    if (list.length === 0)
      list.push("https://via.placeholder.com/500x500?text=No+Image");
    return list;
  };

  const handleAddToCart = async () => {
    message.info("Tính năng đang tạm khóa bảo trì.");
  };

  const handleBuyNow = async () => {
    message.info("Tính năng đang tạm khóa bảo trì.");
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const detailColumns = [
    {
      title: "Thuộc tính",
      dataIndex: "label",
      key: "label",
      width: "30%",
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "Thông tin",
      dataIndex: "value",
      key: "value",
      render: (text: string) => <Text strong>{text}</Text>,
    },
  ];

  const getDetailData = () => {
    if (!product) return [];

    const items = [
      { key: "sku", label: "Mã sản phẩm (SKU)", value: product.sku },
      { key: "brand", label: "Thương hiệu", value: product.brand },
      {
        key: "cats",
        label: "Danh mục",
        value: product.categories?.map(c => c.name).join(", ")
      },
      { key: "weight", label: "Trọng lượng", value: product.weight },
      { key: "dims", label: "Kích thước (DxRxC)", value: product.dimensions },
      { key: "color", label: "Màu sắc", value: product.color },
      { key: "size", label: "Kích cỡ", value: product.size },
    ];

    return items.filter(item => item.value && item.value.trim() !== "");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        Sản phẩm không tồn tại
      </div>
    );
  }

  const discountPercent =
    product.price && product.discountPrice
      ? Math.round(
          ((product.price - product.discountPrice) / product.price) * 100
        )
      : 0;

  return (
    <div style={{ background: "#F0F2F5", paddingBottom: 40 }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 0" }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            { title: "Sản phẩm" },
            { title: product.name },
          ]}
        />
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "#fff",
          padding: 24,
          borderRadius: 8,
        }}
      >
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <div className="product-detail-slider" style={{ marginBottom: 50 }}>
              <Slider {...productSliderSettings}>
                {getProductImages().map((img, index) => (
                  <div key={index} style={{ outline: "none" }}>
                    <div
                      style={{
                        height: 400,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={img}
                        alt={product.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </Col>

          <Col xs={24} md={14}>
            <Title level={3} style={{ marginBottom: 8 }}>
              {product.name}
            </Title>

            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Rate disabled defaultValue={4.5} style={{ fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                (Xem 29 đánh giá) | Đã bán: 100+
              </Text>
            </div>

            <div
              style={{
                background: "#FAFAFA",
                padding: 16,
                borderRadius: 4,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <Text delete style={{ fontSize: 16, color: "#999" }}>
                  {product.discountPrice ? formatCurrency(product.price) : ""}
                </Text>
                <Title level={2} style={{ color: "#C92127", margin: 0 }}>
                  {formatCurrency(product.discountPrice ?? product.price)}
                </Title>
                {discountPercent > 0 && (
                  <Tag color="red">-{discountPercent}%</Tag>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <CarOutlined style={{ color: "#1890ff" }} />
                <Text>Giao hàng miễn phí cho đơn từ 250k</Text>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <Text>Đổi trả trong 30 ngày nếu lỗi nhà sản xuất</Text>
              </div>
            </div>

            <Divider dashed />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ marginRight: 16 }}>
                Số lượng:
              </Text>
              <InputNumber
                min={1}
                max={product.totalStockQuantity || 100}
                value={quantity}
                onChange={(val) => setQuantity(val || 1)}
              />
               <Text type="secondary" style={{ marginLeft: 12 }}>
                {product.hasStock ? `(Còn hàng)` : `(Hết hàng)`}
              </Text>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Button
                disabled={!product.hasStock}
                type="primary"
                ghost
                danger
                icon={<ShoppingCartOutlined />}
                size="large"
                style={{ width: 200, height: 48, fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart();
                }}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                disabled={!product.hasStock}
                type="primary"
                danger
                size="large"
                style={{ width: 200, height: 48, fontWeight: 600 }}
                onClick={handleBuyNow}
              >
                Mua ngay
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "20px auto",
          background: "#fff",
          padding: 24,
          borderRadius: 8,
        }}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  Thông tin chi tiết
                </span>
              ),
              children: (
                <div style={{ marginTop: 10, maxWidth: 800 }}>
                  <Table
                    columns={detailColumns}
                    dataSource={getDetailData()}
                    pagination={false}
                    showHeader={false}
                    size="small"
                    bordered
                  />
                </div>
              ),
            },
            {
              key: "2",
              label: (
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  Mô tả sản phẩm
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>{product.name}</Title>
                  {product.description ? (
                     <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <Paragraph>Đang cập nhật nội dung...</Paragraph>
                  )}

                  {product.specifications && (
                    <div style={{ marginTop: 20 }}>
                        <Title level={5}>Thông số kỹ thuật</Title>
                        <div dangerouslySetInnerHTML={{ __html: product.specifications }} />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "3",
              label: (
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  Đánh giá khách hàng
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  <List
                    itemLayout="horizontal"
                    dataSource={[
                      {
                        user: "Nguyễn Văn A",
                        rate: 5,
                        comment: "Sản phẩm chất lượng, giao hàng nhanh!",
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: "#f56a00" }}>
                              {item.user[0]}
                            </Avatar>
                          }
                          title={
                            <>
                              <Text strong>{item.user}</Text>{" "}
                              <Rate
                                disabled
                                defaultValue={item.rate}
                                style={{ fontSize: 12 }}
                              />
                            </>
                          }
                          description={item.comment}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {similarProducts.length > 0 && (
        <div
          style={{
            maxWidth: 1200,
            margin: "20px auto",
            background: "#fff",
            padding: "20px 30px",
            borderRadius: 8,
          }}
        >
          <Title
            level={4}
            style={{ marginBottom: 20, textTransform: "uppercase" }}
          >
            Sản phẩm gợi ý
          </Title>

          <Slider {...relatedSliderSettings}>
            {similarProducts.map((p) => {
              const pDiscount =
                p.price && p.discountPrice
                  ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
                  : 0;

              return (
                <div key={p.id} style={{ padding: "0 10px" }}>
                  <Card
                    hoverable
                    bordered={false}
                    style={{ height: "100%", boxShadow: "none" }}
                    bodyStyle={{ padding: "10px 0" }}
                    cover={
                      <div style={{ position: "relative", padding: 10 }}>
                        {pDiscount > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              background: "#C92127",
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: "bold",
                              zIndex: 2,
                            }}
                          >
                            -{pDiscount}%
                          </div>
                        )}
                        <img
                          alt={p.name}
                          src={
                            p.thumbnailUrl ||
                            "https://via.placeholder.com/200x280"
                          }
                          style={{
                            height: 220,
                            width: "100%",
                            objectFit: "contain",
                            margin: "0 auto",
                          }}
                        />
                      </div>
                    }
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                    }}
                  >
                    <div style={{ padding: "0 8px" }}>
                      <div
                        style={{
                          height: 44,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          marginBottom: 8,
                          fontSize: 14,
                        }}
                      >
                        {p.name}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text strong style={{ color: "#C92127", fontSize: 16 }}>
                          {formatCurrency(p.discountPrice || p.price)}
                        </Text>
                        {p.discountPrice && (
                          <div
                            style={{
                              background: "#C92127",
                              color: "#fff",
                              padding: "0 4px",
                              borderRadius: 2,
                              fontSize: 11,
                            }}
                          >
                            -{pDiscount}%
                          </div>
                        )}
                      </div>
                      {p.discountPrice && (
                        <Text delete type="secondary" style={{ fontSize: 12 }}>
                          {formatCurrency(p.price)}
                        </Text>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </Slider>

          <div style={{ textAlign: "center", marginTop: 30 }}>
            <Button
              size="large"
              style={{
                width: 200,
                color: "#C92127",
                borderColor: "#C92127",
                fontWeight: 600,
              }}
              onClick={() => navigate("/")}
            >
              Xem thêm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
