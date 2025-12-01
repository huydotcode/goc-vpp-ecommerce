import React, { useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  notification,
  Select,
  Space,
  Upload,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { userService } from "../../../services/user.service";
import type { CreateUserRequest } from "../../../services/user.service";
import { extractErrorMessage } from "../../../utils/error";

interface UserCreateProps {
  isOpenCreateModal: boolean;
  setIsOpenCreateModal: (v: boolean) => void;
  reload: () => void;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

const UserCreate: React.FC<UserCreateProps> = ({
  isOpenCreateModal,
  setIsOpenCreateModal,
  reload,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await userService.uploadAvatar(file);
      if (response?.secureUrl) {
        setAvatarUrl(response.secureUrl);
        form.setFieldsValue({ avatarUrl: response.secureUrl });
        api.success({
          message: "Upload thành công",
          description: "Avatar đã được upload thành công",
        });
      } else {
        throw new Error("Không nhận được URL từ server");
      }
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || "Upload thất bại",
        description: message,
        placement: "topRight",
        duration: 5,
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        api.error({
          message: "Lỗi",
          description: "Chỉ chấp nhận file ảnh",
        });
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        api.error({
          message: "Lỗi",
          description: "Kích thước file phải nhỏ hơn 5MB",
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

  const onFinish = async (values: CreateUserRequest) => {
    try {
      const userData: CreateUserRequest = {
        ...values,
        avatarUrl: avatarUrl || values.avatarUrl,
        isActive: values.isActive ?? true,
      };
      await userService.createUser(userData);
      api.success({
        message: "Thành công",
        description: "Tạo mới user thành công",
        placement: "topRight",
      });
      setIsOpenCreateModal(false);
      form.resetFields();
      setFileList([]);
      setAvatarUrl("");
      reload();
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || "Lỗi",
        description: message,
        placement: "topRight",
        duration: 5,
      });
    }
  };

  const onReset = () => {
    form.resetFields();
    setFileList([]);
    setAvatarUrl("");
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="Tạo mới user"
        open={isOpenCreateModal}
        onClose={() => {
          setIsOpenCreateModal(false);
        }}
        width="60%"
      >
        <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
          <Form.Item
            label="Tên"
            name="username"
            rules={[
              { required: true, message: "Username không được để trống" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email không được để trống" },
              { type: "email", message: "Email không đúng định dạng" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Password không được để trống" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Role không được để trống" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="USER">USER</Select.Option>
              <Select.Option value="EMPLOYEE">EMPLOYEE</Select.Option>
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
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive" initialValue={true}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Tạo
              </Button>
              <Button htmlType="button" onClick={onReset}>
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserCreate;
