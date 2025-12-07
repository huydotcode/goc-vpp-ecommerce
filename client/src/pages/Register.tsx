import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input, Card, Divider } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../api/auth.api";
import { authService } from "../services/auth.service";
import { getErrorMessage } from "../utils/error";

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    try {
      // Đăng ký tài khoản mới (role USER mặc định)
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      toast.success("Đăng ký thành công!");

      // Tự động đăng nhập sau khi đăng ký
      // Backend yêu cầu email để đăng nhập, không phải username
      try {
        await login({
          username: values.email, // Dùng email thay vì username
          password: values.password,
        });
        toast.success("Đăng nhập thành công!");
        // Navigate về trang chủ
        navigate("/");
      } catch {
        // Nếu đăng nhập tự động thất bại, chuyển đến trang login
        toast.info("Vui lòng đăng nhập để tiếp tục");
        navigate("/login");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Đăng ký thất bại");
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
            Đăng ký tài khoản
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-gray-600)",
              margin: 0,
            }}
          >
            Tạo tài khoản mới để bắt đầu
          </p>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label={
              <span style={{ fontWeight: 500, color: "var(--color-gray-900)" }}>
                Tên đăng nhập
              </span>
            }
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập!" },
              {
                min: 3,
                message: "Tên đăng nhập phải có ít nhất 3 ký tự!",
              },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message:
                  "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới!",
              },
            ]}
            style={{ marginBottom: "20px" }}
          >
            <Input
              prefix={
                <UserOutlined style={{ color: "var(--color-gray-400)" }} />
              }
              placeholder="Nhập tên đăng nhập của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ fontWeight: 500, color: "var(--color-gray-900)" }}>
                Email
              </span>
            }
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
            style={{ marginBottom: "20px" }}
          >
            <Input
              prefix={
                <MailOutlined style={{ color: "var(--color-gray-400)" }} />
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
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              {
                min: 6,
                message: "Mật khẩu phải có ít nhất 6 ký tự!",
              },
            ]}
            style={{ marginBottom: "20px" }}
          >
            <Input.Password
              prefix={
                <LockOutlined style={{ color: "var(--color-gray-400)" }} />
              }
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ fontWeight: 500, color: "var(--color-gray-900)" }}>
                Xác nhận mật khẩu
              </span>
            }
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!")
                  );
                },
              }),
            ]}
            style={{ marginBottom: "24px" }}
          >
            <Input.Password
              prefix={
                <LockOutlined style={{ color: "var(--color-gray-400)" }} />
              }
              placeholder="Nhập lại mật khẩu"
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
              Đăng ký
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
          Đăng ký với Google
        </Button>

        {/* Login Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "var(--color-gray-600)",
          }}
        >
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--color-primary)",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
