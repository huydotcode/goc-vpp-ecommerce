import { Layout } from "antd";
import React from "react";
import { Outlet } from "react-router-dom";
import UserHeader from "./UserHeader";
import UserFooter from "./UserFooter";

const { Content } = Layout;

const UserLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <UserHeader />

      <Content style={{ background: "var(--color-gray-100)" }}>
        <div className="mx-auto max-w-[1250px] px-4 md:px-6">
          <Outlet />
        </div>
      </Content>

      <UserFooter />
    </Layout>
  );
};

export default UserLayout;
