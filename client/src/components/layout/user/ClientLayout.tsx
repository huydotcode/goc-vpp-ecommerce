import {
  LogoutOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Layout, Space } from "antd";
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const { Header, Content } = Layout;

const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => {
        // TODO: Navigate to profile page
        console.log("Navigate to profile");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: 1250,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div className="relative h-full" onClick={() => navigate("/home")}>
            <Link to={"/home"}>
              <img
                className="h-full object-cover w-auto"
                src={"/images/logo.png"}
                alt="logo"
              />
            </Link>
          </div>

          <Space size="large">
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                // TODO: Navigate to cart
                console.log("Navigate to cart");
              }}
            >
              Giỏ hàng
            </Button>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  src={user?.avatarUrl}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                <span>{user?.username || user?.email}</span>
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>

      <Content style={{ background: "var(--color-gray-100)" }}>
        <div
          style={{
            maxWidth: 1250,
            margin: "0 auto",
            padding: "24px",
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default ClientLayout;
