import {
  LogoutOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Layout, Space } from "antd";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const { Header } = Layout;

const UserHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const authenticatedMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => {
        navigate("/user/profile");
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

  const guestMenuItems: MenuProps["items"] = [
    {
      key: "login",
      label: "Đăng nhập",
      icon: <UserOutlined />,
      onClick: () => navigate("/login"),
    },
    {
      key: "register",
      label: "Đăng ký",
      icon: <UserOutlined />,
      onClick: () => navigate("/register"),
    },
  ];

  return (
    <Header
      style={{
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: 0,
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1250px] items-center justify-between px-4 md:px-6">
        <div className="relative h-full" onClick={() => navigate("/")}>
          <Link className="flex h-full items-center" to={"/"}>
            {/* Desktop logo */}
            <img
              className="logo-desktop hidden h-full w-auto object-cover md:block"
              src={"/images/logo.png"}
              alt="logo"
            />
            {/* Mobile logo icon */}
            <img
              className="logo-mobile h-10 w-10 object-cover md:hidden"
              src={"/images/logo-icon.png"}
              alt="logo"
            />
          </Link>
        </div>

        <Space size="large">
          {isAuthenticated && (
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                navigate("/cart");
              }}
            >
              Giỏ hàng
            </Button>
          )}

          <Dropdown
            menu={{
              items: isAuthenticated ? authenticatedMenuItems : guestMenuItems,
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: "pointer" }}>
              {isAuthenticated ? (
                <>
                  <Avatar
                    src={user?.avatarUrl}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                  <span className="hidden md:block">
                    {user?.username || user?.email}
                  </span>
                </>
              ) : (
                <>
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                  <span className="hidden md:block">Tài khoản</span>
                </>
              )}
            </Space>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default UserHeader;
