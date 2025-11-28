import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Spin } from 'antd';
import axiosInstance from '../services/axios.config';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const accessToken = searchParams.get('accessToken');
    const error = searchParams.get('error');
    const format = searchParams.get('format') || 'json';

    // Handle error from server
    if (error) {
      message.error(decodeURIComponent(error));
      navigate('/login');
      setLoading(false);
      return;
    }

    // Case 1: Direct redirect from server with accessToken
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      message.success('Đăng nhập Google thành công!');
      navigate('/admin');
      setLoading(false);
      return;
    }

    // Case 2: Have code from Google, need to exchange for token
    if (!code) {
      message.error('Không có authorization code từ Google');
      navigate('/login');
      setLoading(false);
      return;
    }

    const handleCallback = async () => {
      try {
        const response = (await axiosInstance.get(
          `/google/redirect?code=${code}&format=${format}`
        )) as unknown as { accessToken: string; user?: unknown };
        
        if (response && response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          message.success('Đăng nhập Google thành công!');
          navigate('/admin');
        } else {
          throw new Error('Không nhận được access token');
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        message.error(error?.message || 'Đăng nhập Google thất bại');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Đang xử lý đăng nhập Google..." />
      </div>
    );
  }

  return null;
};

export default GoogleCallback;

