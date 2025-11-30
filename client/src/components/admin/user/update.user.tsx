import React, { useEffect, useState } from 'react';
import { Button, Drawer, Form, Input, notification, Select, Space, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { userService } from '../../../services/user.service';
import type { UpdateUserRequest, UserDTO } from '../../../services/user.service';
import { extractErrorMessage } from '../../../utils/errorHandler';

interface UserUpdateProps {
  isOpenUpdateModal: boolean;
  setIsOpenUpdateModal: (v: boolean) => void;
  reload: () => void;
  dataDetailModal: UserDTO | null;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

const UserUpdate: React.FC<UserUpdateProps> = ({
  isOpenUpdateModal,
  setIsOpenUpdateModal,
  reload,
  dataDetailModal,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (dataDetailModal) {
      form.setFieldsValue({
        username: dataDetailModal.username,
        email: dataDetailModal.email,
        role: dataDetailModal.role,
        isActive: dataDetailModal.isActive,
        avatarUrl: dataDetailModal.avatarUrl,
      });
      setAvatarUrl(dataDetailModal.avatarUrl || '');
      if (dataDetailModal.avatarUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'avatar.png',
            status: 'done',
            url: dataDetailModal.avatarUrl,
          },
        ]);
      }
    }
  }, [dataDetailModal, form]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await userService.uploadAvatar(file, dataDetailModal?.id);
      if (response.data?.secureUrl) {
        setAvatarUrl(response.data.secureUrl);
        form.setFieldsValue({ avatarUrl: response.data.secureUrl });
        api.success({
          message: 'Upload thành công',
          description: 'Avatar đã được upload thành công',
        });
      } else {
        throw new Error('Không nhận được URL từ server');
      }
    } catch (error: any) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || 'Upload thất bại',
        description: message,
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        api.error({
          message: 'Lỗi',
          description: 'Chỉ chấp nhận file ảnh',
        });
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        api.error({
          message: 'Lỗi',
          description: 'Kích thước file phải nhỏ hơn 5MB',
        });
        return false;
      }
      handleUpload(file);
      return false;
    },
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    maxCount: 1,
  };

  const onFinish = async (values: UpdateUserRequest) => {
    if (!dataDetailModal) return;

    try {
      const userData: UpdateUserRequest = {
        ...values,
        avatarUrl: avatarUrl || values.avatarUrl,
      };
      await userService.updateUser(dataDetailModal.id, userData);
      api.success({
        message: 'Thành công',
        description: 'Cập nhật user thành công',
        placement: 'topRight',
      });
      setIsOpenUpdateModal(false);
      form.resetFields();
      setFileList([]);
      setAvatarUrl('');
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

  return (
    <>
      {contextHolder}
      <Drawer
        title="Cập nhật người dùng"
        open={isOpenUpdateModal}
        onClose={() => setIsOpenUpdateModal(false)}
        width="60%"
        placement="left"
      >
        <Form {...layout} form={form} name="update-user-form" onFinish={onFinish}>
          <Form.Item
            label="Tên"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password">
            <Input.Password placeholder="Để trống nếu không muốn đổi mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò" disabled={dataDetailModal?.role === 'ADMIN'}>
              <Select.Option value="USER">USER</Select.Option>
              <Select.Option value="EMPLOYEE">EMPLOYEE</Select.Option>
              {dataDetailModal?.role === 'ADMIN' && (
                <Select.Option value="ADMIN">ADMIN</Select.Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item label="Avatar" name="avatarUrl">
            <Upload {...uploadProps} listType="picture-card">
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            {avatarUrl && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive">
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Cập nhật
              </Button>
              <Button htmlType="button" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserUpdate;

