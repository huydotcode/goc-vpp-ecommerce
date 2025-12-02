import React from "react";

const AdminPermissionsPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Trang phân quyền
      </h1>
      <p style={{ color: "#666", margin: 0 }}>
        Chức năng quản lý quyền và vai trò đang được phát triển.
      </p>
    </div>
  );
};

export default AdminPermissionsPage;
