import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { HomeOutlined, LoginOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';

// Placeholder animation - bạn có thể thay bằng animation thật từ assets/animation
const defaultAnimation = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 400,
  h: 400,
  nm: 'Lock Animation',
  ddd: 0,
  assets: [],
  layers: [],
};

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f9f4e8 0%, #ffffff 100%)',
        padding: '0 20px 20px 20px',
      }}
    >
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '800px',
      }}>
        {defaultAnimation.layers && defaultAnimation.layers.length > 0 && (
          <Lottie
            animationData={defaultAnimation}
            style={{
              width: 400,
              height: 400,
              maxWidth: '90vw',
              maxHeight: '50vh',
              marginBottom: '20px',
            }}
            loop={true}
          />
        )}

        <Result
          status="warning"
          title={
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ff5733',
                margin: '0',
              }}
            >
              401
            </h1>
          }
          subTitle={
            <p
              style={{
                fontSize: '18px',
                color: '#555',
                marginTop: '16px',
                maxWidth: '600px',
              }}
            >
              Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
            </p>
          }
          extra={[
            <Button
              key="login"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleGoToLogin}
              style={{
                marginRight: '12px',
                borderRadius: '8px',
                padding: '0 24px',
                height: '40px',
                fontWeight: '600',
              }}
            >
              Đăng nhập
            </Button>,
            <Button
              key="home"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleBackHome}
              style={{
                borderRadius: '8px',
                padding: '0 24px',
                height: '40px',
                fontWeight: '600',
              }}
            >
              Về trang chủ
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default Unauthorized;

