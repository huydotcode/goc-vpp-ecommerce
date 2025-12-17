import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, Card, Divider } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { getErrorMessage } from "../utils/error";

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const userInfo = await login(values);
      toast.success("Đăng nhập thành công!");
      // Navigate based on user role
      if (userInfo?.role === "ADMIN" || userInfo?.role === "EMPLOYEE") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const response = await authService.getGoogleAuthUrl();
      const authUrl = response.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("Không nhận được authUrl từ server");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Không thể lấy Google OAuth URL");
      setGoogleLoading(false);
    }
  };

  // Show nothing while checking authentication or if already authenticated
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 200px)",
        padding: "20px 12px",
      }}
      className="md:py-10 md:px-5"
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          border: "1px solid var(--color-gray-200)",
        }}
        bodyStyle={{
          padding: "24px 20px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "var(--color-gray-900)",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Đăng nhập
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-gray-600)",
              margin: 0,
            }}
          >
            Chào mừng bạn trở lại!
          </p>
        </div>

        {/* Form */}
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label={
              <span style={{ fontWeight: 500, color: "var(--color-gray-900)" }}>
                Email của bạn
              </span>
            }
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập email của bạn!" },
            ]}
            style={{ marginBottom: "20px" }}
          >
            <Input
              prefix={
                <UserOutlined style={{ color: "var(--color-gray-400)" }} />
              }
              placeholder="Nhập email của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ fontWeight: 500, color: "var(--color-gray-900)" }}>
                Mật khẩu
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            style={{ marginBottom: "24px" }}
          >
            <Input.Password
              prefix={
                <LockOutlined style={{ color: "var(--color-gray-400)" }} />
              }
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: "20px" }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: "40px",
                fontSize: "15px",
                fontWeight: "500",
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider
          style={{
            margin: "24px 0",
            borderColor: "var(--color-gray-200)",
          }}
        >
          <span style={{ color: "var(--color-gray-500)", fontSize: "13px" }}>
            Hoặc
          </span>
        </Divider>

        {/* Google Login */}
        <Button
          type="default"
          block
          onClick={handleGoogleLogin}
          loading={googleLoading}
          icon={<GoogleOutlined />}
          style={{
            height: "40px",
            fontSize: "15px",
            fontWeight: "500",
            borderColor: "var(--color-gray-300)",
          }}
        >
          Đăng nhập với Google
        </Button>

        {/* Register Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "var(--color-gray-600)",
          }}
        >
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--color-primary)",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
