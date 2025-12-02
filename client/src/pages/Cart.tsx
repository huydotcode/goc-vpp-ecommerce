import React from "react";

const CartPage: React.FC = () => {
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
        Giỏ hàng
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Chức năng giỏ hàng (thêm, sửa, xóa sản phẩm) đang được phát triển.
      </p>
    </div>
  );
};

export default CartPage;
