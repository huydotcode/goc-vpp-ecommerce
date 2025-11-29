import React, { useRef, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, notification, Popconfirm, Image } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { userService } from '../../../services/user.service';
import type { UserDTO } from '../../../services/user.service';
import { extractErrorMessage } from '../../../utils/errorHandler';
import UserDetail from './detail.user';
import UserCreate from './create-modal.user';
import UserUpdate from './update.user';

const UserAdminMain: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [api, contextHolder] = notification.useNotification();

  const reload = async () => {
    await actionRef.current?.reload();
  };

  // Detail component
  const [isOpenDetailModal, setIsOpenDetailModal] = useState<boolean>(false);
  const [dataDetailModal, setDataDetailModal] = useState<UserDTO | null>(null);

  const handleOpenDetailModal = (record: UserDTO) => {
    setIsOpenDetailModal(true);
    setDataDetailModal(record);
  };

  // Create component
  const [isOpenCreateModal, setIsOpenCreateModal] = useState<boolean>(false);

  const handleOpenCreateModal = () => {
    setIsOpenCreateModal(true);
  };

  // Update component
  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState<boolean>(false);

  const handleOpenUpdateModal = () => {
    setIsOpenUpdateModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.deleteUser(id);
      api.success({
        message: 'Xóa thành công',
        description: 'User đã được xóa thành công',
        placement: 'topRight',
      });
      reload();
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || 'Lỗi',
        description: message,
        placement: 'topRight',
        duration: 5,
      });
    }
  };

  const columns: ProColumns<UserDTO>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      copyable: true,
      render: (_, record) => (
        <a
          onClick={() => {
            handleOpenDetailModal(record);
          }}
        >
          {record.id}
        </a>
      ),
    },
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.avatarUrl ? (
          <Image
            src={record.avatarUrl}
            alt="Avatar"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            N/A
          </div>
        ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      valueType: 'select',
      valueEnum: {
        ADMIN: { text: 'ADMIN' },
        USER: { text: 'USER' },
      },
      render: (_, record) => (
        <Tag color={record.role === 'ADMIN' ? 'red' : 'blue'}>{record.role}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Active' },
        false: { text: 'Inactive' },
      },
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'date',
      hideInSearch: true,
      render: (_, record) =>
        record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      hideInSearch: true,
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            onClick={() => {
              handleOpenUpdateModal();
              setDataDetailModal(record);
            }}
            style={{ cursor: 'pointer', color: '#ff5733', fontSize: '16px' }}
          />
          <Popconfirm
            title="Xóa user"
            description="Bạn có chắc chắn muốn xóa user này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <DeleteOutlined
              style={{ cursor: 'pointer', color: '#ff5733', fontSize: '16px' }}
            />
          </Popconfirm>
          <MoreOutlined
            style={{ cursor: 'pointer', color: '#ff5733', fontSize: '16px' }}
            onClick={() => handleOpenDetailModal(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <h1 style={{ padding: '20px' }}>Quản lý người dùng</h1>
      <UserDetail
        isOpenDetailModal={isOpenDetailModal}
        setIsOpenDetailModal={setIsOpenDetailModal}
        dataDetailModal={dataDetailModal}
        setDataDetailModal={setDataDetailModal}
      />

      <UserCreate
        isOpenCreateModal={isOpenCreateModal}
        setIsOpenCreateModal={setIsOpenCreateModal}
        reload={reload}
      />

      <UserUpdate
        isOpenUpdateModal={isOpenUpdateModal}
        setIsOpenUpdateModal={setIsOpenUpdateModal}
        reload={reload}
        dataDetailModal={dataDetailModal}
      />

      <div style={{ padding: '0 20px 20px 20px' }}>
        <ProTable<UserDTO>
          actionRef={actionRef}
          columns={columns}
          request={async (params) => {
            const queryParams: {
              page?: number;
              size?: number;
              sort?: string;
              direction?: string;
              username?: string;
              email?: string;
              role?: string;
              isActive?: boolean;
            } = {
              page: params.current || 1,
              size: params.pageSize || 10,
              sort: 'id',
              direction: 'desc',
            };

            if (params.username) {
              queryParams.username = params.username;
            }
            if (params.email) {
              queryParams.email = params.email;
            }
            if (params.role) {
              queryParams.role = params.role;
            }
            if (params.isActive !== undefined) {
              queryParams.isActive = params.isActive;
            }

            try {
              const response = await userService.getAllUsers(queryParams);
              if (response && response.result && response.metadata) {
                return {
                  data: response.result,
                  success: true,
                  total: response.metadata.totalElements,
                };
              } else {
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }
            } catch (error: unknown) {
              const { message, errorCode } = extractErrorMessage(error);
              api.error({
                message: errorCode || 'Lỗi',
                description: message,
                placement: 'topRight',
                duration: 5,
              });
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          rowKey="id"
          search={{
            labelWidth: 'auto',
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
          }}
          dateFormatter="string"
          headerTitle="Danh sách người dùng"
          toolBarRender={() => [
            <Button
              key="button"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              type="primary"
            >
              Thêm user
            </Button>,
          ]}
          bordered
          cardBordered
        />
      </div>
    </>
  );
};

export default UserAdminMain;

