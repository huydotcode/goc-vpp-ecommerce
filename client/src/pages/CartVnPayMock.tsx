import { Button, Card, Col, Form, Input, InputNumber, Row, message } from "antd";
import React, { useState } from "react";
import { paymentApi } from "../api/payment.api";

const CartVnPayMock: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const unitPrice = 100000;
  const amount = unitPrice * quantity;

  const handlePay = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const orderInfo = `Thanh toan don hang mock VNPAY cho ${values.fullName}`;

      const res = await paymentApi.createVnPayPayment({
        amount,
        orderInfo,
        locale: "vn",
      });

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        message.error("Khong lay duoc URL thanh toan");
      }
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
      message.error("Co loi xay ra khi tao giao dich VNPAY");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: 24 }}>
          Gio hang mock thanh toan VNPAY
        </h1>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="San pham">
              <p>
                <strong>Ten:</strong> San pham demo VNPAY
              </p>
              <p>
                <strong>Don gia:</strong> {unitPrice.toLocaleString("vi-VN")} VND
              </p>
              <div style={{ marginTop: 16 }}>
                <span style={{ marginRight: 8 }}>So luong:</span>
                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                />
              </div>
              <p style={{ marginTop: 16, fontWeight: "bold" }}>
                Tong tien: {amount.toLocaleString("vi-VN")} VND
              </p>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Thong tin khach hang">
              <Form layout="vertical" form={form}>
                <Form.Item
                  label="Ho ten"
                  name="fullName"
                  rules={[{ required: true, message: "Vui long nhap ho ten" }]}
                >
                  <Input placeholder="Nhap ho ten" />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui long nhap email" },
                    { type: "email", message: "Email khong hop le" },
                  ]}
                >
                  <Input placeholder="Nhap email" />
                </Form.Item>
                <Form.Item
                  label="So dien thoai"
                  name="phone"
                  rules={[{ required: true, message: "Vui long nhap so dien thoai" }]}
                >
                  <Input placeholder="Nhap so dien thoai" />
                </Form.Item>
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading}
                  onClick={handlePay}
                >
                  Thanh toan qua VNPAY
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CartVnPayMock;


