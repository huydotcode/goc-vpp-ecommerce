import {
  EditOutlined,
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Rate,
  Row,
  Spin,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Slider from "react-slick";

import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";

import BestSellers from "@/components/home/BestSellers";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromotionsSection from "@/components/home/PromotionsSection";
import { useCart } from "@/hooks";
import { productService } from "@/services/product.service";
import { promotionService } from "@/services/promotion.service";
import { reviewService } from "@/services/review.service";
import type { Product } from "@/types/product.types";
import type { PromotionResponse } from "@/types/promotion.types";
import type { Review, ReviewStats } from "@/types/review.types";
import { toast } from "sonner";

const { Title, Text, Paragraph } = Typography;

// --- Custom Arrows cho Slider ---
const CustomArrow = (props: any) => {
  const { className, style, onClick, direction, top } = props;
  const [isHovered, setIsHovered] = useState(false);

  const isDisabled = className?.includes("slick-disabled");

  return (
    <div
      style={{
        ...style,
        position: "absolute",
        top: top || "230px",
        transform: "translateY(-50%)",
        zIndex: 20,

        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          isHovered && !isDisabled ? "#a81b20" : "rgba(255, 66, 72, 0.8)",
        color: "#fff",
        borderRadius: "50%",
        width: "44px",
        height: "44px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        border: "2px solid #fff",

        opacity: isDisabled ? 0 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",

        right: direction === "next" ? "-22px" : "auto",
        left: direction === "prev" ? "-22px" : "auto",
      }}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {direction === "next" ? (
        <RightOutlined style={{ fontSize: "20px", fontWeight: "bold" }} />
      ) : (
        <LeftOutlined style={{ fontSize: "20px", fontWeight: "bold" }} />
      )}
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- Product States ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  // --- Review States ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>(
    []
  );

  // --- Review Modal States ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const { addItem } = useCart();

  // --- Slider Settings ---
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
              display: "block",
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
    arrows: true,
    nextArrow: <CustomArrow direction="next" />,
    prevArrow: <CustomArrow direction="prev" />,
  };

  const relatedSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    nextArrow: <CustomArrow direction="next" />,
    prevArrow: <CustomArrow direction="prev" />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 600, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  // --- Fetch Data Effect ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(Number(id));
        setProduct(data);
        productService.trackProductView(Number(id)).catch(console.error);

        fetchReviewsAndStats(Number(id));

        const promos = await promotionService.getActivePromotions();
        setActivePromotions(promos);

        if (data.categories && data.categories.length > 0) {
          const mainCategoryId = data.categories[0].id;
          const suggestions = await productService.getSuggestions({
            categoryId: mainCategoryId,
            limit: 10,
          });
          if (suggestions) {
            setSimilarProducts(suggestions.filter((p) => p.id !== Number(id)));
          }
        } else {
          const fallback = await productService.getProductsPage({
            page: 1,
            size: 6,
          });
          setSimilarProducts(
            fallback.result.filter((p) => p.id !== Number(id))
          );
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
        toast.error("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchReviewsAndStats = async (productId: number) => {
    try {
      setReviewLoading(true);
      const [stats, reviewData] = await Promise.all([
        reviewService.getStats(productId),
        reviewService.getReviewsByProduct(productId, 1, 5),
      ]);

      if (stats) setReviewStats(stats);
      if (reviewData) {
        setReviews(reviewData.result);
        setTotalReviews(reviewData.metadata?.totalElements || 0);
      }
    } catch (error) {
      console.error("Lỗi tải review:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setReviewPage(page);
    setReviewLoading(true);
    const data = await reviewService.getReviewsByProduct(Number(id), page, 5);
    if (data) {
      setReviews(data.result);
    }
    setReviewLoading(false);
  };

  const handleSubmitReview = async (values: any) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.warning("Vui lòng đăng nhập để đánh giá!");
      return;
    }

    try {
      setSubmitLoading(true);
      await reviewService.createReview({
        productId: Number(id),
        rating: values.rating,
        content: values.content,
        userFullName: values.userFullName || "Khách hàng",
      });

      toast.success("Cảm ơn bạn đã đánh giá!");
      setIsReviewModalOpen(false);
      form.resetFields();

      fetchReviewsAndStats(Number(id));
    } catch (error) {
      console.error(error);
      toast.error("Gửi đánh giá thất bại. Vui lòng thử lại!");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getProductImages = () => {
    if (!product) return [];
    const list = [];
    if (product.thumbnailUrl) list.push(product.thumbnailUrl);
    if (product.images && product.images.length > 0) {
      const sortedImages = [...product.images].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      sortedImages.forEach((img) => list.push(img.imageUrl));
    }
    if (list.length === 0)
      list.push("https://via.placeholder.com/500x500?text=No+Image");
    return list;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (quantity <= 0) {
      toast.warning("Số lượng không hợp lệ");
      return;
    }
    if (product.hasStock === false) {
      toast.warning("Sản phẩm đã hết hàng");
      return;
    }
    if (
      product.totalStockQuantity !== undefined &&
      product.totalStockQuantity !== null &&
      product.totalStockQuantity < quantity
    ) {
      toast.warning("Vượt quá tồn kho");
      return;
    }

    const unitPrice = product.discountPrice ?? product.price ?? 0;
    const productImageUrl =
      product.thumbnailUrl || product.images?.[0]?.imageUrl || null;

    try {
      await addItem({
        productId: product.id,
        variantId: null,
        quantity,
        productName: product.name,
        productImageUrl,
        unitPrice,
      });
    } catch (error) {
      toast.error("Thêm vào giỏ thất bại, vui lòng thử lại");
    }
  };

  const handleBuyNow = async () => {
    try {
      await handleAddToCart();
      navigate("/cart");
    } catch {
      /* đã thông báo trong handleAddToCart */
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // --- Prepare Detail Data for Descriptions ---
  const getDetailItems = () => {
    if (!product) return [];
    const items = [
      { key: "sku", label: "Mã sản phẩm", children: product.sku },
      { key: "brand", label: "Thương hiệu", children: product.brand },
      {
        key: "cats",
        label: "Danh mục",
        children: product.categories?.map((c) => c.name).join(", "),
      },
      { key: "weight", label: "Trọng lượng", children: product.weight },
      { key: "dims", label: "Kích thước", children: product.dimensions },
      { key: "color", label: "Màu sắc", children: product.color },
      { key: "size", label: "Kích cỡ", children: product.size },
    ];
    // Filter out empty values
    return items.filter((item) => item.children && item.children.trim() !== "");
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

  // --- Styles for Section Containers ---
  const sectionStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "20px auto",
    background: "#fff",
    padding: 24,
    borderRadius: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: 10,
    textTransform: "uppercase",
  };

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

      {/* --- Main Product Info --- */}
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
                    <Image
                      src={img}
                      alt={product.name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
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
              <Rate
                disabled
                allowHalf
                value={reviewStats?.averageRating || 0}
                style={{ fontSize: 14 }}
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                (Xem {reviewStats?.totalReviews || 0} đánh giá)
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                | Đã bán: {product.soldCount ? product.soldCount : "0"}
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

            {/* --- Promotion Section --- */}
            {activePromotions &&
              activePromotions.length > 0 &&
              activePromotions.some((p) =>
                p.conditions?.some((c) =>
                  c.details?.some((d) => d.productId === product.id)
                )
              ) && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: "12px 16px",
                    background: "#fff0f6",
                    border: "1px dashed #ffadd2",
                    borderRadius: 4,
                  }}
                >
                  <Title
                    level={5}
                    style={{ color: "#c41d7f", marginTop: 0, fontSize: 16 }}
                  >
                    🎁 Khuyến mãi hấp dẫn
                  </Title>
                  <List
                    dataSource={activePromotions.filter(
                      (p) =>
                        !p.conditions ||
                        p.conditions.length === 0 ||
                        p.conditions.some((c) =>
                          c.details.some((d) => d.productId === product.id)
                        )
                    )}
                    renderItem={(promo) => (
                      <List.Item
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px dashed #ffadd266",
                        }}
                      >
                        <div>
                          <Tag color="magenta" style={{ fontWeight: 600 }}>
                            {promo.discountType === "DISCOUNT_AMOUNT"
                              ? "GIẢM GIÁ"
                              : "QUÀ TẶNG"}
                          </Tag>
                          <Text strong style={{ color: "#c41d7f" }}>
                            {promo.name}
                          </Text>

                          <div
                            style={{
                              marginTop: 4,
                              marginLeft: 4,
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {promo.description}
                          </div>
                          {promo.conditions && promo.conditions.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: "8px",
                                background: "#fafafa",
                                borderRadius: 4,
                                border: "1px dashed #d9d9d9",
                              }}
                            >
                              <Text strong style={{ fontSize: 12 }}>
                                Điều kiện áp dụng:
                              </Text>
                              {promo.conditions.map((cond, index) => (
                                <div
                                  key={cond.id || index}
                                  style={{ marginTop: 4, fontSize: 12 }}
                                >
                                  <Text type="secondary" italic>
                                    {cond.operator === "ALL"
                                      ? `• Mua tất cả các sản phẩm sau:`
                                      : `• Mua một trong các sản phẩm sau:`}
                                  </Text>
                                  <ul
                                    style={{
                                      paddingLeft: 20,
                                      margin: "4px 0 0 0",
                                    }}
                                  >
                                    {cond.details.map((d) => (
                                      <li key={d.id}>
                                        {d.productName ||
                                          `Sản phẩm #${d.productId}`}{" "}
                                        <Text type="secondary">
                                          (x{d.requiredQuantity})
                                        </Text>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                          {promo.discountType === "DISCOUNT_AMOUNT" &&
                            promo.discountAmount && (
                              <div style={{ marginTop: 4, marginLeft: 4 }}>
                                Giảm trực tiếp:{" "}
                                <Text type="danger">
                                  {formatCurrency(promo.discountAmount)}
                                </Text>
                              </div>
                            )}
                          {promo.discountType === "GIFT" &&
                            promo.giftItems &&
                            promo.giftItems.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>
                                  Tặng kèm:
                                </div>
                                {promo.giftItems.map((gift) => (
                                  <div
                                    key={gift.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginTop: 4,
                                      background: "#fff",
                                      padding: 4,
                                      borderRadius: 4,
                                    }}
                                  >
                                    {gift.productThumbnailUrl && (
                                      <Avatar
                                        src={gift.productThumbnailUrl}
                                        shape="square"
                                        size="small"
                                      />
                                    )}
                                    <Text>
                                      {gift.productName} (x{gift.quantity})
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </List.Item>
                    )}
                    split={false}
                  />
                </div>
              )}

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

      {/* =========================================================
          SECTION: THÔNG TIN CHI TIẾT
          ========================================================= */}
      <div style={sectionStyle}>
        <Title level={4} style={sectionTitleStyle}>
          Thông tin chi tiết
        </Title>
        <Descriptions
          bordered
          column={1}
          size="middle"
          labelStyle={{ width: "25%", fontWeight: "bold" }}
        >
          {getDetailItems().map((item) => (
            <Descriptions.Item key={item.key} label={item.label}>
              {item.children}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>

      {/* =========================================================
          SECTION: MÔ TẢ SẢN PHẨM
          ========================================================= */}
      <div style={sectionStyle}>
        <Title level={4} style={sectionTitleStyle}>
          Mô tả sản phẩm
        </Title>
        <div style={{ fontSize: 16, lineHeight: 1.8, color: "#333" }}>
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <Paragraph>Chưa có mô tả sản phẩm</Paragraph>
          )}

          {product.specifications && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}>Thông số kỹ thuật chi tiết</Title>
              <div
                dangerouslySetInnerHTML={{ __html: product.specifications }}
              />
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SECTION: ĐÁNH GIÁ KHÁCH HÀNG
          ========================================================= */}
      <div style={sectionStyle}>
        <Title level={4} style={sectionTitleStyle}>
          Đánh giá khách hàng
        </Title>

        {/* Review Summary Header */}
        <Row
          align="middle"
          justify="space-between"
          style={{
            background: "#fffbfb",
            border: "1px solid #f0f0f0",
            padding: 24,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Col>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "#faad14",
                    lineHeight: 1,
                  }}
                >
                  {reviewStats?.averageRating || 0}
                  <span
                    style={{
                      fontSize: 20,
                      color: "#999",
                      fontWeight: "normal",
                    }}
                  >
                    /5
                  </span>
                </div>
                <Rate
                  disabled
                  allowHalf
                  value={reviewStats?.averageRating || 0}
                  style={{ fontSize: 16 }}
                />
              </div>
              <div
                style={{ height: 60, width: 1, background: "#e8e8e8" }}
              ></div>
              <div style={{ color: "#666", fontSize: 16 }}>
                <strong>{reviewStats?.totalReviews || 0}</strong> nhận xét
              </div>
            </div>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsReviewModalOpen(true)}
              size="large"
            >
              Viết đánh giá
            </Button>
          </Col>
        </Row>

        {/* Review List */}
        <List
          itemLayout="vertical"
          loading={reviewLoading}
          dataSource={reviews}
          locale={{
            emptyText: "Chưa có đánh giá nào. Hãy là người đầu tiên!",
          }}
          pagination={{
            onChange: handlePageChange,
            pageSize: 5,
            total: totalReviews,
            current: reviewPage,
            hideOnSinglePage: true,
          }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ borderBottom: "1px solid #f0f0f0", padding: "20px 0" }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    size="large"
                    style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}
                  >
                    {item.userFullName
                      ? item.userFullName.charAt(0).toUpperCase()
                      : "U"}
                  </Avatar>
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {item.userFullName || "Khách hàng ẩn danh"}
                      </Text>
                      <br />
                      <span style={{ fontSize: 12, color: "#999" }}>
                        {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <Rate
                      disabled
                      value={item.rating}
                      style={{ fontSize: 14, marginBottom: 8 }}
                    />
                    <Paragraph style={{ fontSize: 15, color: "#333" }}>
                      {item.content}
                    </Paragraph>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {/* =========================================================
          SECTION: SẢN PHẨM GỢI Ý
          ========================================================= */}
      {similarProducts.length > 0 && (
        <div style={sectionStyle}>
          <Title level={4} style={sectionTitleStyle}>
            Sản phẩm gợi ý
          </Title>

          <div style={{ padding: "0 10px" }}>
            {" "}
            {/* Wrap slider để mũi tên không bị cắt */}
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
                      style={{
                        height: "100%",
                        boxShadow: "none",
                        border: "1px solid #f0f0f0",
                      }}
                      bodyStyle={{ padding: "12px" }}
                      cover={
                        <div style={{ position: "relative", padding: 12 }}>
                          {pDiscount > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                background: "#C92127",
                                color: "#fff",
                                padding: "2px 8px",
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
                              height: 180,
                              width: "100%",
                              objectFit: "contain",
                              margin: "0 auto",
                            }}
                          />
                        </div>
                      }
                      onClick={() => {
                        navigate(`/products/${p.id}`);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <div style={{ height: 44, overflow: "hidden" }}>
                        <Text
                          strong
                          style={{ fontSize: 14, lineHeight: "22px" }}
                          ellipsis={{ tooltip: p.name, rows: 2 }}
                        >
                          {p.name}
                        </Text>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <Text strong style={{ color: "#C92127", fontSize: 16 }}>
                          {formatCurrency(p.price)}
                        </Text>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      )}

      {/* --- Review Modal --- */}
      <Modal
        title="Viết đánh giá sản phẩm"
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
          <Form.Item
            name="rating"
            label="Mức độ hài lòng"
            rules={[{ required: true, message: "Vui lòng chọn số sao" }]}
            initialValue={5}
          >
            <Rate style={{ fontSize: 24 }} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung đánh giá"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung" },
              { min: 10, message: "Nội dung đánh giá ít nhất 10 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
            />
          </Form.Item>

          <Form.Item name="userFullName" label="Tên hiển thị (Tùy chọn)">
            <Input placeholder="Bạn muốn hiển thị tên gì?" />
          </Form.Item>

          <Form.Item>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <Button onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                Gửi đánh giá
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Additional Recommendation Sections from Home */}
      <div style={{ marginTop: 40 }}>
        <PromotionsSection />
      </div>

      <div style={{ marginTop: 40 }}>
        <FeaturedProducts activePromotions={activePromotions} />
      </div>

      <div style={{ marginTop: 40 }}>
        <BestSellers activePromotions={activePromotions} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
