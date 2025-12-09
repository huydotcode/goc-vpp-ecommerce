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
  Modal,
  Form,
  Input,
  Progress,
} from "antd";
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CarOutlined,
  HomeOutlined,
  UserOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { productService } from "@/services/product.service";
import { cartService } from "@/services/cart.service";
import { reviewService } from "@/services/review.service"; // Import service review
import type { Product } from "@/types/product.types";
import type { Review, ReviewStats } from "@/types/review.types"; // Import types review

const { Title, Text, Paragraph } = Typography;

// --- Custom Arrows for Slider ---
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

  // --- Review Modal States ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

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

  // --- Fetch Data Effect ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Product Detail
        const data = await productService.getProductById(Number(id));
        setProduct(data);
        productService.trackProductView(Number(id)).catch(console.error);

        // 2. Fetch Review Stats & List (Parallel)
        fetchReviewsAndStats(Number(id));

        // 3. Fetch Similar Products
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
        message.error("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  // --- Helper: Fetch Review Data ---
  const fetchReviewsAndStats = async (productId: number) => {
    try {
        setReviewLoading(true);
        const [stats, reviewData] = await Promise.all([
            reviewService.getStats(productId),
            reviewService.getReviewsByProduct(productId, 1, 5)
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
          message.warning("Vui lòng đăng nhập để đánh giá!");
          return;
      }

      try {
          setSubmitLoading(true);
          await reviewService.createReview({
              productId: Number(id),
              rating: values.rating,
              content: values.content,
              userFullName: values.userFullName || "Khách hàng"
          });

          message.success("Cảm ơn bạn đã đánh giá!");
          setIsReviewModalOpen(false);
          form.resetFields();

          fetchReviewsAndStats(Number(id));

      } catch (error) {
          console.error(error);
          message.error("Gửi đánh giá thất bại. Vui lòng thử lại!");
      } finally {
          setSubmitLoading(false);
      }
  };

  // --- Helper: Get Images ---
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
    // message.info("Tính năng đang tạm khóa bảo trì.");
     // Code cũ của bạn
     const token = localStorage.getItem("accessToken");
     if (!token) {
       message.warning("Vui lòng đăng nhập để mua hàng!");
       navigate("/login");
       return;
     }
     if (!product) return;
     // ... logic cart service ...
     message.success("Đã thêm vào giỏ hàng (Demo)");
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

  // --- Detail Table Data ---
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
        value: product.categories?.map((c) => c.name).join(", "),
      },
      { key: "weight", label: "Trọng lượng", value: product.weight },
      { key: "dims", label: "Kích thước (DxRxC)", value: product.dimensions },
      { key: "color", label: "Màu sắc", value: product.color },
      { key: "size", label: "Kích cỡ", value: product.size },
    ];
    return items.filter((item) => item.value && item.value.trim() !== "");
  };

  // --- Loading State ---
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
              {/* Star Rating Real Data */}
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
                {" "}
                | Đã bán: {product.totalStockQuantity ? (1000 - product.totalStockQuantity) : "100+"}
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
                    <div
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <Paragraph>Đang cập nhật nội dung...</Paragraph>
                  )}

                  {product.specifications && (
                    <div style={{ marginTop: 20 }}>
                      <Title level={5}>Thông số kỹ thuật</Title>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.specifications,
                        }}
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "3",
              label: `Đánh giá khách hàng (${reviewStats?.totalReviews || 0})`,
              children: (
                <div style={{ marginTop: 16 }}>
                  {/* --- Header Review: Average Rating & Write Button --- */}
                  <Row
                    align="middle"
                    justify="space-between"
                    style={{
                      background: "#fffbfb",
                      border: "1px solid #f9f9f9",
                      padding: 24,
                      borderRadius: 8,
                      marginBottom: 24,
                    }}
                  >
                    <Col>
                       <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                           <div style={{textAlign: 'center'}}>
                               <div style={{ fontSize: 32, fontWeight: "bold", color: "#faad14", lineHeight: 1 }}>
                                    {reviewStats?.averageRating || 0}/5
                               </div>
                               <Rate disabled allowHalf value={reviewStats?.averageRating || 0} />
                           </div>
                           <Divider type="vertical" style={{height: 40}} />
                           <div style={{color: '#666'}}>
                               <div>{reviewStats?.totalReviews || 0} nhận xét</div>
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

                  {/* --- Review List --- */}
                  <List
                    itemLayout="vertical"
                    loading={reviewLoading}
                    dataSource={reviews}
                    locale={{ emptyText: "Chưa có đánh giá nào. Hãy là người đầu tiên!" }}
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
                        style={{borderBottom: '1px solid #f0f0f0', padding: '16px 0'}}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              icon={<UserOutlined />}
                              style={{ backgroundColor: "#fde3cf", color: '#f56a00' }}
                            >
                              {item.userFullName ? item.userFullName.charAt(0).toUpperCase() : "U"}
                            </Avatar>
                          }
                          title={
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <Text strong style={{marginRight: 10}}>
                                  {item.userFullName || "Khách hàng ẩn danh"}
                                </Text>
                                <span style={{fontSize: 12, color: '#999'}}>
                                    {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </span>
                              </div>
                            </div>
                          }
                          description={
                            <div style={{marginTop: 5}}>
                                <Rate disabled value={item.rating} style={{ fontSize: 12, marginRight: 10 }} />
                                <Paragraph style={{marginTop: 8, fontSize: 15, color: '#333'}}>
                                    {item.content}
                                </Paragraph>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />

                  {/* --- Modal Write Review --- */}
                  <Modal
                    title="Viết đánh giá sản phẩm"
                    open={isReviewModalOpen}
                    onCancel={() => setIsReviewModalOpen(false)}
                    footer={null}
                    destroyOnClose
                  >
                    <Form
                      form={form}
                      onFinish={handleSubmitReview}
                      layout="vertical"
                    >
                      <Form.Item
                        name="rating"
                        label="Mức độ hài lòng"
                        rules={[
                          { required: true, message: "Vui lòng chọn số sao" },
                        ]}
                        initialValue={5}
                      >
                        <Rate style={{fontSize: 24}} />
                      </Form.Item>

                      <Form.Item
                        name="content"
                        label="Nội dung đánh giá"
                        rules={[
                          { required: true, message: "Vui lòng nhập nội dung" },
                          { min: 10, message: "Nội dung đánh giá ít nhất 10 ký tự" }
                        ]}
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        />
                      </Form.Item>

                      {/* Optional: Input Name */}
                      <Form.Item name="userFullName" label="Tên hiển thị (Tùy chọn)">
                          <Input placeholder="Bạn muốn hiển thị tên gì?" />
                      </Form.Item>

                      <Form.Item>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 10}}>
                            <Button onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
                            <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitLoading}
                            >
                            Gửi đánh giá
                            </Button>
                        </div>
                      </Form.Item>
                    </Form>
                  </Modal>
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
                  ? Math.round(
                      ((p.price - p.discountPrice) / p.price) * 100
                    )
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
