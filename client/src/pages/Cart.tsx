import { Button, Card, Empty, Image, Space, Typography } from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";

const { Title, Text } = Typography;

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, updateItem, removeItem, updating, removing } =
    useCart();

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
    } catch {
      // Error đã được handle trong hook
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.warning("Giỏ hàng trống");
      return;
    }
    navigate("/checkout");
  };

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
          flexDirection: "row",
          gap: 16,
          alignItems: "flex-start",
        }}
        className="flex-col md:flex-row"
      >
        {/* Cart Items */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {cart.items.map((item: (typeof cart.items)[0]) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: 16,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                      {item.productName}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {formatCurrency(item.unitPrice)} / sản phẩm
                    </Text>
                  </div>

                  {/* Quantity Control */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 120,
                    }}
                  >
                    <Text strong>Số lượng</Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "1px solid #d9d9d9",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleQuantityChange(item.id, item.quantity - 1);
                          }
                        }}
                        disabled={updating || item.quantity <= 1}
                        style={{
                          border: "none",
                          borderRadius: 0,
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                      <div
                        style={{
                          minWidth: 48,
                          textAlign: "center",
                          padding: "0 8px",
                          fontSize: "var(--font-size-base)",
                          fontWeight: "var(--font-weight-medium)",
                          borderLeft: "1px solid #d9d9d9",
                          borderRight: "1px solid #d9d9d9",
                          lineHeight: "36px",
                        }}
                      >
                        {item.quantity}
                      </div>
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          if (item.quantity < 999) {
                            handleQuantityChange(item.id, item.quantity + 1);
                          }
                        }}
                        disabled={updating || item.quantity >= 999}
                        style={{
                          border: "none",
                          borderRadius: 0,
                          width: 36,
                          height: 36,
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
                      alignItems: "flex-end",
                      gap: 8,
                      minWidth: 150,
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
          style={{ width: "100%", maxWidth: 350 }}
          className="md:max-w-[350px]"
        >
          <Card style={{ position: "sticky", top: 16 }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Title level={4}>Tóm tắt đơn hàng</Title>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tổng số lượng:</Text>
                <Text strong>{cart.totalItems} sản phẩm</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
                <Text strong>{formatCurrency(cart.totalAmount)}</Text>
              </div>
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
                  {formatCurrency(cart.totalAmount)}
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                block
                onClick={handleCheckout}
                style={{ marginTop: 16 }}
              >
                Thanh toán
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
