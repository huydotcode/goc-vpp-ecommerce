import React from "react";
import { Button, Card, Space, message, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import apiClient from "../api/client";
import { getErrorMessage } from "../utils/error";

const Admin: React.FC = () => {
  const { logout, refreshToken } = useAuth();
  const navigate = useNavigate();

  const handleTestRefresh = async () => {
    try {
      const response = await authService.testRefresh();
      message.success("Test refresh thành công!");
      console.log("Token info:", response);
    } catch (error: unknown) {
      message.error(getErrorMessage(error) || "Test refresh thất bại");
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refreshToken();
      message.success("Refresh token thành công!");
    } catch (error: unknown) {
      message.error(getErrorMessage(error) || "Refresh token thất bại");
    }
  };

  const handleTestProtectedAPI = async () => {
    try {
      const response = await apiClient.get("/test-refresh");
      message.success("API call thành công!");
      console.log("Response:", response);
    } catch (error: unknown) {
      message.error(getErrorMessage(error) || "API call thất bại");
    }
  };

  const handleTestInvalidToken = async () => {
    localStorage.setItem("accessToken", "invalid_token");
    try {
      await apiClient.get("/test-refresh");
    } catch (error: unknown) {
      message.error(
        "Expected error: " + (getErrorMessage(error) || "Invalid token")
      );
    }
  };

  const handleTestExpiredToken = async () => {
    localStorage.setItem(
      "accessToken",
      "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired"
    );
    try {
      await apiClient.get("/test-refresh");
    } catch (error: unknown) {
      message.error(
        "Expected error: " + (getErrorMessage(error) || "Expired token")
      );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h1>Trang Admin</h1>
        <p>Chào mừng đến trang quản trị!</p>

        <Space direction="vertical" style={{ width: "100%", marginTop: 24 }}>
          <h3>Test Authentication</h3>

          <Button type="primary" onClick={handleTestRefresh} block>
            Test Refresh Token Info
          </Button>

          <Button onClick={handleManualRefresh} block>
            Manual Refresh Token
          </Button>

          <Button onClick={handleTestProtectedAPI} block>
            Test Protected API Call
          </Button>

          <Divider />

          <h3>Test Error Cases</h3>

          <Button danger onClick={handleTestInvalidToken} block>
            Test Invalid Token
          </Button>

          <Button danger onClick={handleTestExpiredToken} block>
            Test Expired Token
          </Button>

          <Divider />

          <h3>Test Error Pages</h3>

          <Button
            type="default"
            onClick={() => navigate("/404")}
            block
            style={{ marginBottom: 8 }}
          >
            Test 404 Page
          </Button>

          <Button
            type="default"
            onClick={() => navigate("/403")}
            block
            style={{ marginBottom: 8 }}
          >
            Test 403 Page
          </Button>

          <Button
            type="default"
            onClick={() => navigate("/401")}
            block
            style={{ marginBottom: 8 }}
          >
            Test 401 Page
          </Button>

          <Divider />

          <Button type="primary" danger onClick={logout} block>
            Đăng xuất
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Admin;
