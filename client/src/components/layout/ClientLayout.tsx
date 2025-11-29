import React from 'react';
import { Layout, Button, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;

const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      icon: <UserOutlined />,
      onClick: () => {
        // TODO: Navigate to profile page
        console.log('Navigate to profile');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ff6b35',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/home')}
        >
          Cửa hàng
        </div>

        <Space size="large">
          <Button
            type="text"
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              // TODO: Navigate to cart
              console.log('Navigate to cart');
            }}
          >
            Giỏ hàng
          </Button>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                src={user?.avatarUrl}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#ff6b35' }}
              />
              <span>{user?.username || user?.email}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default ClientLayout;

