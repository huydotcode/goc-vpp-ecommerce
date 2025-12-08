import { Button, Card, Divider, Result, Space, Typography, Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const OrderResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status") || "failed";
  const message = searchParams.get("message") || "";
  const orderCode = searchParams.get("orderCode") || "";
  const code = searchParams.get("code") || "";
  const id = searchParams.get("id") || "";

  const isSuccess = status === "success";
  const isCOD = message.includes("COD");

  return (
    <div
      style={{
        padding: "var(--spacing-lg) var(--spacing-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div style={{ maxWidth: 600, width: "100%" }}>
        <Card
          style={{
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            border: "none",
          }}
        >
          <Result
            status={isSuccess ? "success" : "error"}
            style={{ padding: "var(--spacing-md) 0" }}
            icon={
              isSuccess ? (
                <CheckCircleOutlined
                  style={{
                    fontSize: 56,
                    color: "var(--color-success)",
                  }}
                />
              ) : (
                <CloseCircleOutlined
                  style={{
                    fontSize: 56,
                    color: "var(--color-error)",
                  }}
                />
              )
            }
            title={
              <Title level={4} style={{ marginBottom: 0 }}>
                {isSuccess
                  ? isCOD
                    ? "Đặt hàng thành công!"
                    : "Thanh toán thành công!"
                  : "Thanh toán thất bại"}
              </Title>
            }
            subTitle={
              <Paragraph
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-gray-600)",
                  marginTop: "var(--spacing-sm)",
                  marginBottom: 0,
                }}
              >
                {message ||
                  (isSuccess
                    ? "Đơn hàng của bạn đã được xử lý thành công."
                    : "Đã xảy ra lỗi trong quá trình thanh toán.")}
              </Paragraph>
            }
          />

          {(orderCode || id || code) && (
            <>
              <Divider style={{ margin: "var(--spacing-md) 0" }} />
              <div
                style={{
                  background: "var(--color-gray-50)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-md)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                <Title
                  level={5}
                  style={{
                    marginBottom: "var(--spacing-sm)",
                    fontSize: "var(--font-size-base)",
                  }}
                >
                  Thông tin đơn hàng
                </Title>
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {orderCode && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "var(--spacing-sm)",
                      }}
                    >
                      <Text strong style={{ fontSize: "var(--font-size-sm)" }}>
                        Mã đơn hàng:
                      </Text>
                      <Tag
                        color="blue"
                        style={{
                          fontSize: "var(--font-size-sm)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        {orderCode}
                      </Tag>
                    </div>
                  )}
                  {id && !isCOD && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "var(--spacing-sm)",
                      }}
                    >
                      <Text strong style={{ fontSize: "var(--font-size-sm)" }}>
                        Payment ID:
                      </Text>
                      <Text code style={{ fontSize: "var(--font-size-xs)" }}>
                        {id}
                      </Text>
                    </div>
                  )}
                  {code && !isCOD && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "var(--spacing-sm)",
                      }}
                    >
                      <Text strong style={{ fontSize: "var(--font-size-sm)" }}>
                        Mã PayOS:
                      </Text>
                      <Text code style={{ fontSize: "var(--font-size-xs)" }}>
                        {code}
                      </Text>
                    </div>
                  )}
                </Space>
              </div>
            </>
          )}

          <Divider style={{ margin: "var(--spacing-md) 0" }} />

          <Space
            size="small"
            style={{
              width: "100%",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="primary"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{
                minWidth: 140,
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              Về trang chủ
            </Button>
            {isSuccess && (
              <Button
                icon={<ShoppingOutlined />}
                onClick={() => navigate("/user/orders")}
                style={{
                  minWidth: 140,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                Xem đơn hàng
              </Button>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default OrderResult;
