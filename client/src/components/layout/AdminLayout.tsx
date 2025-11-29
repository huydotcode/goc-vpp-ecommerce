import React, { useState } from 'react';
import {
  PieChartOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './AdminHeader';

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const items: MenuItem[] = [
    getItem('Tổng quan', '1', <PieChartOutlined />, () => {
      navigate('/admin');
    }),
    getItem('Người dùng', '2', <UserOutlined />, () => {
      navigate('/admin/users');
    }),
    getItem('Phân quyền', '3', <LockOutlined />, () => {
      navigate('/admin/permissions');
    }),
    getItem('Đăng xuất', '4', <LogoutOutlined />, () => {
      logout();
    }),
  ];

  const menuKeyMap: Record<string, string> = {
    '/admin': '1',
    '/admin/users': '2',
    '/admin/permissions': '3',
  };

  const selectedKey = menuKeyMap[location.pathname] || '1';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ff5733',
          colorBgLayout: isDarkTheme ? '#141414' : '#f5f5f5',
          colorText: isDarkTheme ? '#f5f5f5' : '#333',
          fontSize: 14,
        },
        components: {
          Layout: {
            headerBg: isDarkTheme ? '#141414' : '#f5f5f5',
            headerColor: isDarkTheme ? '#f5f5f5' : '#333333',
            footerBg: isDarkTheme ? '#141414' : '#f5f5f5',
            colorBgLayout: isDarkTheme ? '#141414' : '#f5f5f5',
            siderBg: isDarkTheme ? '#141414' : '#f5f5f5',
            triggerBg: isDarkTheme ? '#ff5733' : '#ff5733',
            triggerColor: isDarkTheme ? '#f5f5f5' : '#f5f5f5',
            boxShadow: 'none',
          },
          Menu: {
            itemBg: isDarkTheme ? '#141414' : '#f5f5f5',
            colorBorder: 'transparent',
          },
          Input: {
            colorBorder: isDarkTheme ? '#333' : '#dedede',
          },
          Card: {
            colorBorder: isDarkTheme ? '#333' : '#dedede',
          },
          Table: {
            colorBgBase: isDarkTheme ? '#141414' : '#f5f5f5',
            boxShadow: '0px 0 10px rgba(0, 0, 0, 0.2)',
          },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', position: 'relative' }}>
        <Sider
          style={{
            boxShadow: '8px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRight: isDarkTheme
              ? '1px solid #141414'
              : '1px solid #dedede',
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '64px',
              padding: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: isDarkTheme ? '1px solid #333' : '1px solid #dedede',
            }}
          >
            {!collapsed ? (
              <h2 style={{ margin: 0, color: isDarkTheme ? '#f5f5f5' : '#333' }}>
                Admin Panel
              </h2>
            ) : (
              <h2 style={{ margin: 0, color: isDarkTheme ? '#f5f5f5' : '#333' }}>
                AP
              </h2>
            )}
          </div>

          <Menu
            style={{
              borderInlineEnd: 'none',
            }}
            selectedKeys={[selectedKey]}
            mode="inline"
            items={items}
          />
        </Sider>
        <Layout>
          <AdminHeader isDarkTheme={isDarkTheme} setIsDarkTheme={setIsDarkTheme} />
          <Content style={{ padding: '16px' }}>
            <Outlet />
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Admin Panel ©{new Date().getFullYear()} Created by Your Team
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;

