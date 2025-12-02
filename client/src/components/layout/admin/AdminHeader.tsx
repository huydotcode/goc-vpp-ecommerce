import React from "react";
import { Header } from "antd/es/layout/layout";
import { Avatar, Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { MoonOutlined, SunOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

interface AdminHeaderProps {
  isDarkTheme: boolean;
  setIsDarkTheme: (value: boolean) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  isDarkTheme,
  setIsDarkTheme,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuAvatar: MenuProps["items"] = [
    {
      key: "profile",
      label: "Hồ sơ",
      icon: <UserOutlined />,
      onClick: () => {
        navigate("/admin/profile");
      },
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <UserOutlined />,
      danger: true,
      onClick: () => {
        logout();
      },
    },
  ];

  return (
    <Header
      style={{
        padding: "0 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: isDarkTheme ? "1px solid #333" : "1px solid #dddddd",
      }}
    >
      <div></div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="text"
          icon={isDarkTheme ? <SunOutlined /> : <MoonOutlined />}
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{ fontSize: "18px" }}
        />

        <Dropdown
          menu={{ items: menuAvatar }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            size="large"
            style={{
              cursor: "pointer",
              backgroundColor: "var(--color-primary)",
            }} // Thay #ff5733
            icon={<UserOutlined />}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default AdminHeader;
