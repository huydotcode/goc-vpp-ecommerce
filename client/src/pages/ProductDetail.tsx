import React from "react";
import { useParams } from "react-router-dom";

const ProductDetailPage: React.FC = () => {
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
        Chi tiết sản phẩm
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Trang chi tiết sản phẩm đang được phát triển.
      </p>
      {id && (
        <p style={{ color: "#999", margin: 0 }}>
          Mã sản phẩm: <strong>{id}</strong>
        </p>
      )}
    </div>
  );
};

export default ProductDetailPage;
