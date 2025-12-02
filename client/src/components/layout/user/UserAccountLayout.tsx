import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const items: TabsProps["items"] = [
  {
    key: "profile",
    label: "Thông tin cá nhân",
  },
  {
    key: "orders",
    label: "Đơn hàng của tôi",
  },
];

const UserAccountLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = location.pathname.includes("/user/orders")
    ? "orders"
    : "profile";

  const handleTabChange = (key: string) => {
    navigate(`/user/${key}`);
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-[900px] rounded-lg bg-white p-4 shadow-sm md:p-6">
        <h1 className="mb-4 text-xl font-semibold">Tài khoản của tôi</h1>
        <Tabs activeKey={activeKey} items={items} onChange={handleTabChange} />
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserAccountLayout;
