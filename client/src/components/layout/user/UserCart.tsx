import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Empty,
  Image,
  InputNumber,
  Popover,
  Space,
  Typography,
} from "antd";
import { motion, useAnimationControls } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../hooks/useCart";
import { formatPrice } from "../../../utils/format";

const { Text } = Typography;

const UserCart: React.FC = () => {
  const { cart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartPopoverOpen, setIsCartPopoverOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);

  // Animation controls
  const outerControls = useAnimationControls();
  const innerControls = useAnimationControls();

  // Get cart item count
  const currentCartCount = cart?.items.length || 0;

  // Detect cart count change and trigger animation
  useEffect(() => {
    if (currentCartCount !== cartItemCount) {
      setCartItemCount(currentCartCount);
      // Trigger animation when count changes (and is not initial load)
      if (cartItemCount > 0 || currentCartCount > 0) {
        // Trigger animations
        outerControls.start({
          scale: [1, 1.15, 1],
          rotate: [0, -5, 5, -5, 0],
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        });

        innerControls.start({
          boxShadow: [
            "0 0 0px rgba(239, 68, 68, 0)",
            "0 0 20px rgba(239, 68, 68, 0.6)",
            "0 0 0px rgba(239, 68, 68, 0)",
          ],
          transition: {
            duration: 0.6,
            ease: "easeOut",
          },
        });
      }
    }
  }, [currentCartCount, cartItemCount, outerControls, innerControls]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Cart dropdown handlers
  const handleQuantityChange = async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(cartItemId);
    } else {
      await updateItem({ cartItemId, quantity });
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    await removeItem(cartItemId);
  };

  // Handle popover hover with delay
  const handlePopoverMouseEnter = () => {
    isHoveringRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsCartPopoverOpen(true);
  };

  const handlePopoverMouseLeave = () => {
    isHoveringRef.current = false;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setIsCartPopoverOpen(false);
      }
    }, 200);
  };

  // Cart dropdown content
  const cartDropdownContent = (
    <div
      style={{ width: 360, maxHeight: 480 }}
      onMouseEnter={handlePopoverMouseEnter}
      onMouseLeave={handlePopoverMouseLeave}
    >
      {!cart || cart.items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Giỏ hàng trống"
          style={{ padding: "24px 0" }}
        />
      ) : (
        <>
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              padding: "8px 0",
            }}
          >
            {cart.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {/* Product Image */}
                <div style={{ flexShrink: 0 }}>
                  {item.productImageUrl ? (
                    <Image
                      src={item.productImageUrl}
                      alt={item.productName}
                      width={60}
                      height={60}
                      style={{
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                      preview={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "#999",
                      }}
                    >
                      {item.productName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    strong
                    ellipsis={{ tooltip: item.productName }}
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontSize: "13px",
                    }}
                  >
                    {item.productName}
                  </Text>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "11px",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    {formatPrice(item.unitPrice)}
                  </Text>

                  {/* Quantity Control */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <InputNumber
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(value) => {
                        if (value !== null) {
                          handleQuantityChange(item.id, value);
                        }
                      }}
                      size="small"
                      style={{ width: 70 }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      style={{ padding: "0 4px" }}
                    />
                  </div>
                </div>

                {/* Subtotal */}
                <div
                  style={{
                    flexShrink: 0,
                    textAlign: "right",
                    minWidth: 80,
                  }}
                >
                  <Text strong style={{ color: "#ef4444", fontSize: "14px" }}>
                    {formatPrice(item.subtotal)}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: 12,
              borderTop: "2px solid #f0f0f0",
              marginTop: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text strong>Tổng tiền:</Text>
              <Text strong style={{ fontSize: "18px", color: "#ef4444" }}>
                {formatPrice(cart.totalAmount)}
              </Text>
            </div>

            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Button
                type="primary"
                block
                icon={<ShoppingCartOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/cart");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Xem giỏ hàng
              </Button>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/checkout");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={cart.items.length === 0}
              >
                Thanh toán
              </Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      <motion.div
        animate={outerControls}
        style={{
          borderRadius: "8px",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Popover
          content={cartDropdownContent}
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>Giỏ hàng</Text>
              {cart && cart.items.length > 0 && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {cart.items.length} sản phẩm
                </Text>
              )}
            </div>
          }
          trigger={[]}
          placement="bottomRight"
          open={isCartPopoverOpen}
          onOpenChange={(open) => {
            if (!open && !isHoveringRef.current) {
              setIsCartPopoverOpen(false);
            }
          }}
          destroyTooltipOnHide={false}
        >
          <Badge
            count={currentCartCount}
            showZero={false}
            offset={[-8, 8]}
            overflowCount={99}
          >
            <motion.div
              animate={innerControls}
              style={{
                borderRadius: "8px",
              }}
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
            >
              <Button
                type="text"
                icon={<ShoppingCartOutlined style={{ fontSize: "18px" }} />}
                onClick={() => navigate("/cart")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "40px",
                  width: "40px",
                  padding: 0,
                  borderRadius: "8px",
                }}
                className="hover:bg-gray-100"
              />
            </motion.div>
          </Badge>
        </Popover>
      </motion.div>
    </div>
  );
};

export default UserCart;
