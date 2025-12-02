import React from "react";

const AdminOrdersPage: React.FC = () => {
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
        Quản lý đơn hàng
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Trang quản lý danh sách đơn hàng đang được phát triển. Tại đây admin có
        thể xem, lọc và cập nhật trạng thái đơn hàng.
      </p>
    </div>
  );
};

export default AdminOrdersPage;
