import React, { useEffect, useState } from 'react';
import { Descriptions, Drawer, Tag } from 'antd';
import type { UserDTO } from '../../../services/user.service';

interface UserDetailProps {
  isOpenDetailModal: boolean;
  setIsOpenDetailModal: (v: boolean) => void;
  dataDetailModal: UserDTO | null;
  setDataDetailModal: (v: UserDTO | null) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({
  isOpenDetailModal,
  setIsOpenDetailModal,
  dataDetailModal,
  setDataDetailModal,
}) => {
  return (
    <Drawer
      title="Chi tiết người dùng"
      open={isOpenDetailModal}
      onClose={() => {
        setIsOpenDetailModal(false);
      }}
      width="60%"
    >
      {dataDetailModal && (
        <Descriptions title="Thông Tin Người Dùng" bordered column={2}>
          <Descriptions.Item label="ID">{dataDetailModal.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">{dataDetailModal.username}</Descriptions.Item>
          <Descriptions.Item label="Email">{dataDetailModal.email}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={dataDetailModal.role === 'ADMIN' ? 'red' : 'blue'}>
              {dataDetailModal.role}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={dataDetailModal.isActive ? 'green' : 'red'}>
              {dataDetailModal.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          {dataDetailModal.avatarUrl && (
            <Descriptions.Item label="Avatar" span={2}>
              <img
                src={dataDetailModal.avatarUrl}
                alt="Avatar"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px' }}
              />
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Tạo lúc">
            {dataDetailModal.createdAt
              ? new Date(dataDetailModal.createdAt).toLocaleString('vi-VN')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {dataDetailModal.createdBy || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lúc">
            {dataDetailModal.updatedAt
              ? new Date(dataDetailModal.updatedAt).toLocaleString('vi-VN')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Người cập nhật">
            {dataDetailModal.updatedBy || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
};

export default UserDetail;

