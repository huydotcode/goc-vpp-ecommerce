import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import Lottie from 'lottie-react';
import { useAuth } from '../contexts/AuthContext';
import protectedAnimation from '../assets/animation/protectedAnimation.json';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const handleGoHome = () => {
    // Nếu là USER, về /home, nếu là ADMIN/EMPLOYEE, về /admin
    if (userRole === 'USER') {
      navigate('/home');
    } else if (userRole === 'ADMIN' || userRole === 'EMPLOYEE') {
      navigate('/admin');
    } else {
      navigate('/');
    }
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
        <Lottie
          animationData={protectedAnimation}
          style={{
            width: 400,
            height: 400,
            maxWidth: '90vw',
            maxHeight: '50vh',
            marginBottom: '20px',
          }}
          loop={true}
        />

        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#ff5733',
            margin: '0 0 16px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          403
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: '#555',
            marginTop: '16px',
            marginBottom: '32px',
            maxWidth: '600px',
          }}
        >
          Xin lỗi, bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>

        <Button
          size="large"
          icon={<HomeOutlined />}
          onClick={handleGoHome}
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
      </div>
    </div>
  );
};

export default Forbidden;

