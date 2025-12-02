import React from "react";

const RegisterPage: React.FC = () => {
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
        Đăng ký tài khoản
      </h1>
      <p style={{ color: "#666", margin: 0, textAlign: "center" }}>
        Trang đăng ký đang được phát triển. Sau khi hoàn thiện, bạn có thể tạo
        tài khoản mới tại đây.
      </p>
    </div>
  );
};

export default RegisterPage;
