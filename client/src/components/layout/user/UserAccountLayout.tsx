import { useAuth } from "@/contexts/AuthContext";
import {
  MenuOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Drawer, Menu, Tag, Typography } from "antd";
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Text } = Typography;

const UserAccountLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeKey = location.pathname.includes("/user/orders")
    ? "orders"
    : "profile";

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
    },
    {
      key: "orders",
      icon: <ShoppingOutlined />,
      label: "Đơn hàng của tôi",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(`/user/${key}`);
    setMobileMenuOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "EMPLOYEE":
        return "Nhân viên";
      default:
        return "Người dùng";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "red";
      case "EMPLOYEE":
        return "blue";
      default:
        return "default";
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* User Info Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center text-center">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={user?.avatarUrl}
            className="mb-4"
          />
          <Typography.Title level={5} className="mb-2 mt-0">
            {user?.username || "Người dùng"}
          </Typography.Title>
          <Text type="secondary" className="block mb-2 text-sm">
            {user?.email}
          </Text>
          {user?.role && (
            <Tag color={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Tag>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-r-0 flex-1"
        style={{ height: "100%" }}
      />
    </div>
  );

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-max-width px-2 sm:px-4 py-4 sm:py-6">
        <div className="overflow-hidden flex flex-col lg:flex-row h-full gap-4">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-[280px] shrink-0 border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
            {sidebarContent}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-[80vh] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Mobile Menu Button */}
            <div className="lg:hidden w-full border-b border-gray-200 px-4 py-3">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-2 p-0 h-auto"
              >
                Menu
              </Button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex flex-col items-center text-center pt-4">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src={user?.avatarUrl}
              className="mb-3"
            />
            <Typography.Title level={5} className="mb-1 mt-0">
              {user?.username || "Người dùng"}
            </Typography.Title>
            <Text type="secondary" className="block mb-2 text-sm">
              {user?.email}
            </Text>
            {user?.role && (
              <Tag color={getRoleColor(user.role)}>
                {getRoleLabel(user.role)}
              </Tag>
            )}
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        bodyStyle={{ padding: 0 }}
        className="lg:hidden"
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Drawer>
    </div>
  );
};

export default UserAccountLayout;
