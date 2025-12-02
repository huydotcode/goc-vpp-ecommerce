import React from "react";

const AdminProfilePage: React.FC = () => {
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
        Trang thông tin quản trị viên
      </h1>
      <p style={{ color: "#666", margin: 0 }}>
        Khu vực cấu hình và cập nhật thông tin tài khoản quản trị đang được phát
        triển.
      </p>
    </div>
  );
};

export default AdminProfilePage;
