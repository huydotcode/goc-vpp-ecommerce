import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';

// Placeholder animation - bạn có thể thay bằng animation thật từ assets/animation
const defaultAnimation = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 400,
  h: 400,
  nm: '403 Animation',
  ddd: 0,
  assets: [],
  layers: [],
};

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

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
          status="403"
          title={
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ff5733',
                margin: '0',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              403
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
              Xin lỗi, bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
            </p>
          }
          extra={
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                borderRadius: '8px',
                padding: '0 32px',
                height: '44px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Về trang chủ
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default Forbidden;

