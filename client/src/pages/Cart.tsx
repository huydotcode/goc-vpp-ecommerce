import {
  Button,
  Card,
  Checkbox,
  Empty,
  Image,
  Modal,
  Radio,
  Space,
  Typography,
  Grid,
  Tag,
  Avatar,
  List
} from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  GiftOutlined
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart.types";
import type { ProductVariant } from "@/types/variant.types";
import { variantApi } from "@/api/variant.api";
import { cartService } from "@/services/cart.service";
import { promotionService } from "@/services/promotion.service";
import type { PromotionResponse } from "@/types/promotion.types";

const { Title, Text } = Typography;

const CartPage: React.FC = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.xl;
  const imageSize = isMobile ? 80 : 100;

  const navigate = useNavigate();
  const {
    cart,
    isLoading,
    updateItem,
    removeItem,
    updating,
    removing,
    refetch,
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
  const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>([]);

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
      await cartService.updateItemVariant({
        cartItemId: editingCartItem.id,
        variantId: selectedVariantId,
      });
      toast.success("Đã cập nhật phân loại");
      setVariantModalOpen(false);
      refetch();
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Không thể cập nhật phân loại";
      toast.error(errorMessage);
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
    navigate("/checkout", {
      state: { selectedCartItemIds: Array.from(selectedItemIds) },
    });
  };

  // Tính tổng từ các items đã chọn
  const selectedItems =
    cart?.items.filter((item) => selectedItemIds.has(item.id)) ?? [];
  const selectedTotalAmount = selectedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const selectedTotalItems = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

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
                      {activePromotions.filter(p => !p.conditions || p.conditions.length === 0 || p.conditions.some(c => c.details.some(d => d.productId === item.productId))).map(promo => (
                        <Tag key={promo.id} color={promo.discountType === "GIFT" ? "purple" : "volcano"} style={{ marginRight: 4, marginBottom: 4 }}>
                          {promo.discountType === "GIFT" ? <><GiftOutlined /> Tặng quà</> : "Giảm giá"}
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
                <Text strong>{formatCurrency(selectedTotalAmount)}</Text>
              </div>

              {cart.discountAmount && cart.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#52c41a" }}>
                  <Text type="success">Giảm giá:</Text>
                  <Text strong type="success">-{formatCurrency(cart.discountAmount)}</Text>
                </div>
              )}

              {cart.giftItems && cart.giftItems.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: "#faad14" }}>Quà tặng kèm:</Text>
                  {cart.giftItems.map((gift, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      {gift.productImageUrl && (
                        <Image src={gift.productImageUrl} width={30} height={30} style={{ borderRadius: 4 }} preview={false} />
                      )}
                      <Text style={{ fontSize: 13 }}>{gift.productName} (x{gift.quantity})</Text>
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
                  {formatCurrency(cart.finalAmount && selectedItemIds.size === cart.items.length ? cart.finalAmount : selectedTotalAmount)}
                </Text>
              </div>

              {selectedItemIds.size !== cart.items.length && cart.discountAmount && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  * Chọn tất cả sản phẩm để áp dụng mã giảm giá của đơn hàng.
                </Text>
              )}

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
