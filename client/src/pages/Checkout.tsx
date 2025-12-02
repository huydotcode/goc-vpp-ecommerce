import React from "react";

const CheckoutPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Thanh toán
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Trang thanh toán đang được phát triển. Tại đây bạn sẽ xác nhận đơn hàng
        và nhập thông tin giao hàng/thanh toán.
      </p>
    </div>
  );
};

export default CheckoutPage;
