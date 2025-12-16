import { variantApi } from "@/api/variant.api";
import { promotionService } from "@/services/promotion.service";
import type {
  CartItem,
  CartPromotionPreview,
  GiftItem,
  PromotionSummary,
} from "@/types/cart.types";
import type { PromotionResponse } from "@/types/promotion.types";
import type { ProductVariant } from "@/types/variant.types";
import {
  DeleteOutlined,
  GiftOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Grid,
  Image,
  Modal,
  Radio,
  Space,
  Tag,
  Typography,
} from "antd";
<<<<<<< HEAD
import React, { useEffect, useState } from "react";
=======
import React, { useEffect, useMemo, useState } from "react";
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "../hooks";
import { formatCurrency } from "../utils/format";
import { useAuth } from "@/contexts/AuthContext";

const { Title, Text } = Typography;

const CartPage: React.FC = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.xl;
  const imageSize = isMobile ? 80 : 100;

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    cart,
    isLoading,
    updateItem,
    removeItem,
    updating,
    removing,
    previewPromotions,
  } = useCart();

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
  const [updatingVariant, setUpdatingVariant] = useState(false);
  const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>(
    []
  );
<<<<<<< HEAD
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
=======
  const [previewPromo, setPreviewPromo] = useState<CartPromotionPreview | null>(
    null
  );
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8

  // Fetch Promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await promotionService.getActivePromotions();
        setActivePromotions(data);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      }
    };
    fetchPromotions();
  }, []);

  // Tự động chọn tất cả khi cart load
  useEffect(() => {
    if (cart && cart.items.length > 0 && selectedItemIds.size === 0) {
      setSelectedItemIds(new Set(cart.items.map((item) => item.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // Convert selectedItemIds Set thành array ổn định để dùng trong dependencies
  const selectedItemIdsArray = useMemo(
    () => Array.from(selectedItemIds).sort((a, b) => a - b),
    [selectedItemIds]
  );

  // Cập nhật preview khuyến mãi theo các item được chọn
  useEffect(() => {
    const updatePreview = async () => {
      if (!cart || selectedItemIdsArray.length === 0) {
        setPreviewPromo(null);
        return;
      }

      // Kiểm tra xem có phải chọn toàn bộ items không (so sánh IDs, không chỉ length)
      const allCartItemIds = cart.items
        .map((item) => item.id)
        .sort((a, b) => a - b);
      const isSelectingAll =
        selectedItemIdsArray.length === allCartItemIds.length &&
        selectedItemIdsArray.every((id, index) => id === allCartItemIds[index]);

      // Nếu chọn toàn bộ và đã có thông tin trên cart, tạo preview từ cart data
      if (isSelectingAll && cart.discountAmount !== undefined) {
        const subtotal = cart.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        setPreviewPromo({
          subtotal,
          discountAmount: cart.discountAmount ?? 0,
          finalAmount: cart.finalAmount ?? subtotal,
          appliedPromotions: cart.appliedPromotions ?? [],
          giftItems: cart.giftItems ?? [],
        });
        return;
      }

      try {
        const preview = await previewPromotions(selectedItemIdsArray);
        setPreviewPromo(preview);
      } catch (error) {
        console.error("Failed to preview promotions", error);
        setPreviewPromo(null);
      }
    };

    void updatePreview();
  }, [cart, selectedItemIdsArray, previewPromotions]);

  const handleQuantityChange = async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      return;
    }
    try {
      await updateItem({ cartItemId, quantity });
    } catch {
      // Error đã được handle trong hook
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeItem(cartItemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      // Xóa khỏi selected nếu đang được chọn
      setSelectedItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    } catch {
      // Error đã được handle trong hook
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!cart) return;
    if (selectedItemIds.size === cart.items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(cart.items.map((item) => item.id)));
    }
  };

  const handleChangeVariant = async (item: CartItem) => {
    setEditingCartItem(item);
    setSelectedVariantId(item.variantId ?? null);
    setVariantModalOpen(true);
    try {
      setLoadingVariants(true);
      const productVariants = await variantApi.getVariantsByProductId(
        item.productId,
        true
      );
      setVariants(productVariants);
    } catch (error) {
      toast.error("Không thể tải danh sách phân loại");
      console.error(error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleConfirmVariantChange = async () => {
    if (!editingCartItem) return;
    if (selectedVariantId === editingCartItem.variantId) {
      setVariantModalOpen(false);
      return;
    }
    try {
      setUpdatingVariant(true);
      // TODO: nếu cần, có thể nối lại với service update variant trong tương lai
      toast.error("Chức năng đổi phân loại tạm thời chưa được hỗ trợ");
    } finally {
      setUpdatingVariant(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.warning("Giỏ hàng trống");
      return;
    }
    if (selectedItemIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để tiếp tục");
      return;
    }

    navigate("/checkout", {
      state: {
        selectedCartItemIds: Array.from(selectedItemIds),
        selectedPromotionId: selectedPromotionId, // Pass selected promotion
      },
    });
  };

<<<<<<< HEAD
  // Calculate selected items with memoization to prevent unnecessary re-renders
  const selectedItems = React.useMemo(
    () => cart?.items.filter((item) => selectedItemIds.has(item.id)) ?? [],
    [cart?.items, selectedItemIds]
  );

  // Filter applicable promotions based on selected cart items
  const applicablePromotions = React.useMemo(() => {
    return activePromotions.filter((promo) => {
      // Only discount promotions can be selected
      if (promo.discountType !== PromotionDiscountType.DISCOUNT_AMOUNT) return false;
      if ((promo.discountAmount ?? 0) <= 0) return false;

      // Check if promotion conditions are satisfied
      if (!promo.conditions || promo.conditions.length === 0) {
        return true; // No conditions = applies to all
      }

      // Check if ALL condition groups are satisfied
      return promo.conditions.some((condGroup) => {
        if (condGroup.operator === "ALL") {
          // ALL: Every condition detail must be satisfied
          return condGroup.details.every((detail) => {
            const cartItem = selectedItems.find(
              (item) => item.productId === detail.productId
            );
            // Check if item exists AND has enough quantity
            return cartItem && cartItem.quantity >= detail.requiredQuantity;
          });
        } else {
          // ANY: At least one condition detail must be satisfied
          return condGroup.details.some((detail) => {
            const cartItem = selectedItems.find(
              (item) => item.productId === detail.productId
            );
            // Check if item exists AND has enough quantity
            return cartItem && cartItem.quantity >= detail.requiredQuantity;
          });
        }
      });
    });
  }, [activePromotions, selectedItems]);

  // Identify the best promotion (highest discount)
  const bestPromotion = React.useMemo(() => {
    if (applicablePromotions.length === 0) return null;
    return applicablePromotions.reduce((best, current) => {
      const bestAmount = best.discountAmount ?? 0;
      const currentAmount = current.discountAmount ?? 0;
      return currentAmount > bestAmount ? current : best;
    });
  }, [applicablePromotions]);

  // Auto-select best promotion
  React.useEffect(() => {
    if (bestPromotion && !selectedPromotionId) {
      setSelectedPromotionId(bestPromotion.id);
    }
  }, [bestPromotion, selectedPromotionId]);

  // Clear selected promotion if it's no longer applicable
  React.useEffect(() => {
    if (
      selectedPromotionId &&
      !applicablePromotions.some((p) => p.id === selectedPromotionId)
    ) {
      setSelectedPromotionId(null);
    }
  }, [selectedPromotionId, applicablePromotions]);

  // Calculate total amount from selected items (using original prices)
  const selectedTotalAmount = selectedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
=======
  const selectedItems =
    cart?.items.filter((item) => selectedItemIds.has(item.id)) ?? [];

  // Tổng tạm tính (ưu tiên dùng subtotal từ preview nếu có)
  const selectedSubtotal = previewPromo
    ? previewPromo.subtotal
    : selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Lấy thông tin khuyến mãi từ preview hoặc cart
  const displayDiscountAmount = previewPromo
    ? previewPromo.discountAmount
    : cart && selectedItemIds.size === cart.items.length
      ? (cart.discountAmount ?? 0)
      : 0;

  const displayFinalAmount = previewPromo
    ? previewPromo.finalAmount
    : cart && selectedItemIds.size === cart.items.length && cart.finalAmount
      ? cart.finalAmount
      : selectedSubtotal;

  const displayAppliedPromotions: PromotionSummary[] = previewPromo
    ? previewPromo.appliedPromotions
    : cart && selectedItemIds.size === cart.items.length
      ? (cart.appliedPromotions ?? [])
      : [];

  const displayGiftItems: GiftItem[] = previewPromo
    ? previewPromo.giftItems
    : cart && selectedItemIds.size === cart.items.length
      ? (cart.giftItems ?? [])
      : [];
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8

  const selectedTotalItems = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

<<<<<<< HEAD
  // Calculate order-level promotion discount (applied once, not per item)
  const selectedItemsDiscount = React.useMemo(() => {
    if (!selectedPromotionId) return 0;

    const selectedPromo = applicablePromotions.find(
      (p) => p.id === selectedPromotionId
    );

    if (!selectedPromo) return 0;

    // Check if promotion conditions are satisfied
    if (!selectedPromo.conditions || selectedPromo.conditions.length === 0) {
      // No conditions = applies to order
      return selectedPromo.discountAmount ?? 0;
    }

    // Check if selected items meet the promotion conditions (including quantity)
    const conditionsMet = selectedPromo.conditions.some((condGroup) => {
      if (condGroup.operator === "ALL") {
        // ALL: Every condition detail must be satisfied (product + quantity)
        return condGroup.details.every((detail) => {
          const cartItem = selectedItems.find(
            (item) => item.productId === detail.productId
          );
          // Check if item exists AND has enough quantity
          return cartItem && cartItem.quantity >= detail.requiredQuantity;
        });
      } else {
        // ANY: At least one condition detail must be satisfied (product + quantity)
        return condGroup.details.some((detail) => {
          const cartItem = selectedItems.find(
            (item) => item.productId === detail.productId
          );
          // Check if item exists AND has enough quantity
          return cartItem && cartItem.quantity >= detail.requiredQuantity;
        });
      }
    });

    return conditionsMet ? (selectedPromo.discountAmount ?? 0) : 0;
  }, [selectedPromotionId, applicablePromotions, selectedItems]);

=======
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8
  if (isLoading) {
    return (
      <div style={{ padding: 24, minHeight: "60vh" }}>
        <Card loading={true} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ padding: 24, minHeight: "60vh" }}>
        <Card>
          <Empty
            image={
              <ShoppingCartOutlined
                style={{ fontSize: 64, color: "#d9d9d9" }}
              />
            }
            description="Giỏ hàng trống"
          >
            <Button type="primary" onClick={() => navigate("/")}>
              Tiếp tục mua sắm
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1200, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Giỏ hàng
      </Title>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: isMobile ? "stretch" : "flex-start",
        }}
      >
        {/* Cart Items */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={
                  cart.items.length > 0 &&
                  selectedItemIds.size === cart.items.length
                }
                indeterminate={
                  selectedItemIds.size > 0 &&
                  selectedItemIds.size < cart.items.length
                }
                onChange={handleSelectAll}
              >
                <Text strong>Chọn tất cả ({cart.items.length} sản phẩm)</Text>
              </Checkbox>
            </div>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {cart.items.map((item: CartItem) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    gap: isMobile ? 12 : 16,
                    padding: isMobile ? 12 : 16,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    alignItems: isMobile ? "flex-start" : "center",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingTop: 4,
                      width: isMobile ? 28 : "auto",
                    }}
                  >
                    <Checkbox
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </div>

                  {/* Product Image */}
                  <div
                    style={{
                      width: imageSize,
                      height: imageSize,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      alignSelf: isMobile ? "flex-start" : "center",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/products/${item.productId}`)}
                  >
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                    ) : (
                      <ShoppingCartOutlined
                        style={{ fontSize: 32, color: "#d9d9d9" }}
                      />
                    )}
                  </div>

                  {/* Product Info */}
                  <div
                    style={{
                      flex: "1 1 220px",
                      minWidth: 0,
                    }}
                  >
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        marginBottom: 4,
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      {item.productName}
                    </Title>
                    {/* --- Promotions Display --- */}
                    <div style={{ marginBottom: 8 }}>
                      {activePromotions
                        .filter(
                          (p) =>
                            !p.conditions ||
                            p.conditions.length === 0 ||
                            p.conditions.some((c) =>
                              c.details.some(
                                (d) => d.productId === item.productId
                              )
                            )
                        )
                        .map((promo) => (
                          <Tag
                            key={promo.id}
                            color={
                              promo.discountType === "GIFT"
                                ? "purple"
                                : "volcano"
                            }
                            style={{ marginRight: 4, marginBottom: 4 }}
                          >
                            {promo.discountType === "GIFT" ? (
                              <>
                                <GiftOutlined /> Tặng quà
                              </>
                            ) : (
                              "Giảm giá"
                            )}
                          </Tag>
                        ))}
                    </div>
                    {item.variantName && (
                      <div style={{ marginBottom: 8 }}>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 13,
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Phân loại: {item.variantName}{" "}
                          {item.sku ? `(${item.sku})` : ""}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0, height: "auto" }}
                          onClick={() => handleChangeVariant(item)}
                        >
                          Đổi phân loại
                        </Button>
                      </div>
                    )}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {formatCurrency(item.unitPrice)} / sản phẩm
                    </Text>
                  </div>

                  {/* Quantity Control */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "row" : "column",
                      alignItems: isMobile ? "center" : "center",
                      gap: isMobile ? 8 : 4,
                      minWidth: isMobile ? "100%" : 100,
                      justifyContent: isMobile ? "space-between" : "flex-start",
                    }}
                  >
                    <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>
                      Số lượng
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #d9d9d9",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MinusOutlined style={{ fontSize: 12 }} />}
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleQuantityChange(item.id, item.quantity - 1);
                          }
                        }}
                        disabled={updating || item.quantity <= 1}
                        style={{
                          border: "none",
                          borderRadius: 0,
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                      <div
                        style={{
                          minWidth: 36,
                          textAlign: "center",
                          padding: "0 4px",
                          fontSize: "var(--font-size-sm)",
                          fontWeight: "var(--font-weight-medium)",
                          borderLeft: "1px solid #d9d9d9",
                          borderRight: "1px solid #d9d9d9",
                          lineHeight: "28px",
                        }}
                      >
                        {item.quantity}
                      </div>
                      <Button
                        type="text"
                        icon={<PlusOutlined style={{ fontSize: 12 }} />}
                        onClick={() => {
                          if (item.quantity < 999) {
                            handleQuantityChange(item.id, item.quantity + 1);
                          }
                        }}
                        disabled={updating || item.quantity >= 999}
                        style={{
                          border: "none",
                          borderRadius: 0,
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMobile ? "flex-start" : "flex-end",
                      gap: 8,
                      flex: isMobile ? "1 1 180px" : "0 0 150px",
                      minWidth: isMobile ? 160 : 150,
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(item.id)}
                      loading={removing}
                      size="small"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </div>

        {/* Order Summary */}
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : 350,
            marginTop: isMobile ? 16 : 0,
          }}
        >
          {/* Promotion Selector */}
          {applicablePromotions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15 }}>
                Chọn khuyến mãi
              </Text>
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {applicablePromotions.map((promo) => {
                  const isBest = bestPromotion?.id === promo.id;
                  const isSelected = selectedPromotionId === promo.id;
                  return (
                    <Card
                      key={promo.id}
                      size="small"
                      hoverable
                      onClick={() => setSelectedPromotionId(promo.id)}
                      style={{
                        cursor: "pointer",
                        borderColor: isSelected ? "#1890ff" : "#d9d9d9",
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: isSelected ? "#e6f7ff" : "white",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Radio checked={isSelected} style={{ marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Text strong>{promo.name}</Text>
                            {isBest && (
                              <Tag color="gold" style={{ margin: 0 }}>
                                Tốt nhất
                              </Tag>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                            Giảm {formatCurrency(promo.discountAmount ?? 0)}
                          </Text>
                          {/* Display Conditions */}
                          {promo.conditions && promo.conditions.length > 0 && (
                            <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                              <Text style={{ fontSize: 12, fontWeight: 500 }}>Điều kiện:</Text>
                              {promo.conditions.map((condGroup, idx) => (
                                <div key={idx} style={{ marginLeft: 8, marginTop: 2 }}>
                                  {condGroup.operator === "ALL" ? "Tất cả: " : "Một trong: "}
                                  {condGroup.details.map((detail, detailIdx) => (
                                    <span key={detailIdx}>
                                      {detail.productName || `SP #${detail.productId}`} x{detail.requiredQuantity}
                                      {detailIdx < condGroup.details.length - 1 && ", "}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          {(promo.startDate || promo.endDate) && (
                            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                              {promo.startDate && promo.endDate ? (
                                <>
                                  {new Date(promo.startDate).toLocaleDateString("vi-VN")} -{" "}
                                  {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                                </>
                              ) : promo.startDate ? (
                                <>Từ {new Date(promo.startDate).toLocaleDateString("vi-VN")}</>
                              ) : promo.endDate ? (
                                <>Đến {new Date(promo.endDate).toLocaleDateString("vi-VN")}</>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </Space>
            </div>
          )}

          <Card style={{ position: "sticky", top: 16 }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Title level={4}>Tóm tắt đơn hàng</Title>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tổng số lượng:</Text>
                <Text strong>
                  {selectedTotalItems} sản phẩm
                  {selectedItemIds.size < cart.items.length && (
                    <span style={{ color: "#999", fontSize: 12 }}>
                      {" "}
                      (đã chọn)
                    </span>
                  )}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
<<<<<<< HEAD
                <Text strong>
                  {formatCurrency(selectedTotalAmount)}
                </Text>
=======
                <Text strong>{formatCurrency(selectedSubtotal)}</Text>
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8
              </div>

              {displayDiscountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text>Giảm giá đơn hàng:</Text>
                  <Text strong>-{formatCurrency(displayDiscountAmount)}</Text>
                </div>
              )}

<<<<<<< HEAD
              {cart.giftItems && cart.giftItems.length > 0 && (
=======
              {displayAppliedPromotions.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    Khuyến mãi đang áp dụng:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {displayAppliedPromotions.map((promo) => (
                      <div
                        key={promo.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 4,
                          padding: 8,
                          backgroundColor: "#f0f7ff",
                          borderRadius: 6,
                          border: "1px solid #d6e4ff",
                          gap: 12,
                        }}
                      >
                        <div>
                          <Text
                            strong
                            style={{ fontSize: 12, display: "block" }}
                          >
                            {promo.name}
                          </Text>
                          {promo.description && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, display: "block" }}
                            >
                              {promo.description}
                            </Text>
                          )}
                        </div>
                        {promo.discountType === "DISCOUNT_AMOUNT" &&
                          promo.value > 0 && (
                            <Text>-{formatCurrency(promo.value)}</Text>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayGiftItems.length > 0 && (
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: "#faad14" }}>
                    Quà tặng kèm:
                  </Text>
                  {displayGiftItems.map((gift, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 4,
                        alignItems: "center",
                      }}
                    >
                      {gift.productImageUrl && (
                        <Image
                          src={gift.productImageUrl}
                          width={30}
                          height={30}
                          style={{ borderRadius: 4 }}
                          preview={false}
                        />
                      )}
                      <Text style={{ fontSize: 13 }}>
                        {gift.productName} (x{gift.quantity})
                      </Text>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 16,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
<<<<<<< HEAD
                  {formatCurrency(selectedTotalAmount - selectedItemsDiscount)}
=======
                  {formatCurrency(displayFinalAmount)}
>>>>>>> a865864929d02aca3d4ea699fb17bfb3b06bc8a8
                </Text>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleCheckout}
                disabled={selectedItemIds.size === 0}
                style={{ marginTop: 16 }}
              >
                Thanh toán ({selectedItemIds.size})
              </Button>
            </Space>
          </Card>
        </div>
      </div>

      {/* Modal chọn variant */}
      <Modal
        title="Chọn phân loại"
        open={variantModalOpen}
        onCancel={() => {
          setVariantModalOpen(false);
          setEditingCartItem(null);
          setSelectedVariantId(null);
        }}
        onOk={handleConfirmVariantChange}
        confirmLoading={updatingVariant}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        {loadingVariants ? (
          <div style={{ textAlign: "center", padding: 20 }}>Đang tải...</div>
        ) : variants.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            Không có phân loại nào
          </div>
        ) : (
          <Radio.Group
            value={selectedVariantId ?? undefined}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {variants.map((variant) => (
                <Radio key={variant.id} value={variant.id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {variant.variantValue === "Default"
                        ? "Mặc định"
                        : variant.variantValue}
                    </div>
                    {variant.stockQuantity !== null &&
                      variant.stockQuantity !== undefined && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Kho: {variant.stockQuantity}
                        </Text>
                      )}
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </Modal>
    </div>
  );
};

export default CartPage;
