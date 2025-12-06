import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, Card, Space, Divider } from "antd";
import Lottie from "lottie-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { getErrorMessage } from "../utils/error";

// Placeholder animation - bạn có thể thay bằng animation thật từ assets/animation
const loginAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 400,
  h: 400,
  nm: "Login Animation",
  ddd: 0,
  assets: [],
  layers: [],
};

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      toast.success("Đăng nhập thành công!");
      // Đợi một chút để đảm bảo user info đã được load
      setTimeout(() => {
        // Redirect sẽ được xử lý bởi RoleBasedRedirect trong App.tsx
        navigate("/");
      }, 100);
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

  const handleTestMockLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.testGoogleLogin(
        "test@gmail.com",
        "Test User"
      );
      // Clean token trước khi lưu
      const cleanToken = response.accessToken
        .trim()
        .replace(/^["']|["']$/g, "");
      localStorage.setItem("accessToken", cleanToken);
      toast.success("Mock login thành công!");
      // Redirect sẽ được xử lý bởi RoleBasedRedirect trong App.tsx
      navigate("/");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Mock login thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleTestRefresh = async () => {
    try {
      const response = await authService.testRefresh();
      toast.success("Test refresh thành công!");
      console.log("Refresh token info:", response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Test refresh thất bại");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9f4e8 0%, #ffffff 100%)",
      }}
    >
      <Card
        style={{
          width: 450,
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <Lottie
            animationData={loginAnimation}
            style={{
              width: 150,
              height: 150,
            }}
            loop={true}
          />
        </div>
        <h2
          style={{
            textAlign: "center",
            marginBottom: 24,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Đăng nhập
        </h2>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập username!" }]}
          >
            <Input placeholder="root_admin@system.local" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập password!" }]}
          >
            <Input.Password placeholder="123123" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider>Hoặc</Divider>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            type="default"
            block
            onClick={handleGoogleLogin}
            loading={googleLoading}
          >
            Đăng nhập với Google
          </Button>

          <Button
            type="dashed"
            block
            onClick={handleTestMockLogin}
            loading={loading}
          >
            Test Mock Login (Không cần Google)
          </Button>

          <Button type="link" block onClick={handleTestRefresh}>
            Test Refresh Token
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
