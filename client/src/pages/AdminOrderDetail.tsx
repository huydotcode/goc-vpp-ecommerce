import React from "react";
import { useParams } from "react-router-dom";

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
        Chi tiết đơn hàng
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Trang chi tiết đơn hàng đang được phát triển. Admin sẽ xem và cập nhật
        thông tin đơn hàng tại đây.
      </p>
      {id && (
        <p style={{ color: "#999", margin: 0 }}>
          Mã đơn hàng: <strong>{id}</strong>
        </p>
      )}
    </div>
  );
};

export default AdminOrderDetailPage;
