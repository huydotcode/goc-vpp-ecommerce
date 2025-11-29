import React from 'react';
import { PlusOutlined } from '@ant-design/icons';

interface UploadButtonProps {
  isDarkTheme?: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({ isDarkTheme = false }) => {
  return (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined
        style={{
          marginTop: 8,
          color: isDarkTheme ? '#f5f5f5' : '#333',
        }}
      />
      <div
        style={{
          marginTop: 8,
          color: isDarkTheme ? '#f5f5f5' : '#333',
        }}
      >
        Upload
      </div>
    </button>
  );
};

export default UploadButton;

