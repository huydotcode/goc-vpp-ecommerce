import React, { useState } from "react";
import {
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { ConfigProvider, Layout, Menu, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import AdminHeader from "./AdminHeader";

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  onClick?: () => void,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    onClick,
    label,
  } as MenuItem;
}

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const items: MenuItem[] = [
    getItem("Tổng quan", "1", <PieChartOutlined />, () => {
      navigate("/admin");
    }),
    ...(userRole !== "EMPLOYEE"
      ? [
          getItem("Người dùng", "2", <UserOutlined />, () => {
            navigate("/admin/users");
          }),
        ]
      : []),
    getItem("Danh mục", "3", <AppstoreOutlined />, () => {
      navigate("/admin/categories");
    }),
    getItem("Sản phẩm", "4", <ShoppingOutlined />, () => {
      navigate("/admin/products");
    }),
    getItem("Đơn hàng", "5", <ShoppingCartOutlined />, () => {
      navigate("/admin/orders");
    }),
    getItem("Khuyến mãi", "6", <GiftOutlined />, () => {
      navigate("/admin/promotions");
    }),
    getItem("Đăng xuất", "7", <LogoutOutlined />, () => {
      logout();
    }),
  ];

  const menuKeyMap: Record<string, string> = {
    "/admin": "1",
    "/admin/users": "2",
    "/admin/categories": "3",
    "/admin/products": "4",
    "/admin/orders": "5",
    "/admin/promotions": "6",
  };

  // Xác định selected key, ưu tiên theo pathname chính xác, sau đó theo prefix
  let selectedKey = menuKeyMap[location.pathname];

  // Nếu không tìm thấy exact match, kiểm tra theo prefix (cho các trang detail)
  if (!selectedKey) {
    if (location.pathname.startsWith("/admin/orders")) {
      selectedKey = "5";
    } else {
      selectedKey = "1";
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#ef4444", // Dùng hex trực tiếp thay vì CSS variable
          colorBgLayout: isDarkTheme ? "#141414" : "#f5f5f5",
          colorText: isDarkTheme ? "#f5f5f5" : "#212121",
          fontSize: 14,
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,
        },
        components: {
          Layout: {
            headerBg: isDarkTheme ? "#141414" : "#f5f5f5",
            headerColor: isDarkTheme ? "#f5f5f5" : "#212121",
            footerBg: isDarkTheme ? "#141414" : "#f5f5f5",
            colorBgLayout: isDarkTheme ? "#141414" : "#f5f5f5",
            siderBg: isDarkTheme ? "#141414" : "#f5f5f5",
            triggerBg: "#ef4444",
            triggerColor: isDarkTheme ? "#f5f5f5" : "#f5f5f5",
            boxShadow: "none",
          },
          Menu: {
            itemBg: isDarkTheme ? "#141414" : "#f5f5f5",
            colorBorder: "transparent",
            itemSelectedBg: "#ef4444",
            itemSelectedColor: "#ffffff",
            itemHoverBg: isDarkTheme
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(239, 68, 68, 0.1)",
            itemActiveBg: "#ef4444",
            itemHoverColor: "#ef4444",
            subMenuItemBg: isDarkTheme ? "#141414" : "#f5f5f5",
          },
          // THÊM CONFIG CHO BUTTON
          Button: {
            borderRadius: 6,
            primaryShadow: "0 2px 0 rgba(239, 68, 68, 0.1)",
            colorPrimary: "#ef4444",
            colorPrimaryHover: "#f87171", // Red-400
            colorPrimaryActive: "#dc2626", // Red-600
          },
          // THÊM CONFIG ĐẦY ĐỦ CHO INPUT
          Input: {
            borderRadius: 6,
            activeBorderColor: "#ef4444",
            hoverBorderColor: "#f87171",
            colorBorder: isDarkTheme ? "#333" : "#e0e0e0",
            activeShadow: "0 0 0 2px rgba(239, 68, 68, 0.2)",
          },
          Card: {
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          },
          Table: {
            colorBgBase: isDarkTheme ? "#141414" : "#f5f5f5",
            boxShadow: "0px 0 10px rgba(0, 0, 0, 0.2)",
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", position: "relative" }}>
        <Sider
          style={{
            boxShadow: "8px 2px 8px rgba(0, 0, 0, 0.1)",
            borderRight: isDarkTheme
              ? "1px solid #141414"
              : "1px solid #dedede",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "64px",
              padding: "12px",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: isDarkTheme
                ? "1px solid #333"
                : "1px solid #dedede",
            }}
          >
            {!collapsed ? (
              <h2
                style={{
                  margin: 0,
                  color: isDarkTheme ? "#f5f5f5" : "var(--color-gray-800)",
                }}
              >
                Admin Panel
              </h2>
            ) : (
              <h2
                style={{
                  margin: 0,
                  color: isDarkTheme ? "#f5f5f5" : "var(--color-gray-800)",
                }}
              >
                AP
              </h2>
            )}
          </div>

          <Menu
            style={{
              borderInlineEnd: "none",
            }}
            selectedKeys={[selectedKey]}
            mode="inline"
            items={items}
          />
        </Sider>
        <Layout>
          <AdminHeader
            isDarkTheme={isDarkTheme}
            setIsDarkTheme={setIsDarkTheme}
          />
          <Content style={{ padding: "16px" }}>
            <Outlet />
          </Content>
          <Footer style={{ textAlign: "center" }}>
            Admin Panel ©{new Date().getFullYear()} Created by Your Team
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;
