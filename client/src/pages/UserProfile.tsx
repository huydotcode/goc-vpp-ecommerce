import React from "react";
import { Button, Form, Input } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import type { UpdateUserRequest } from "@/services/user.service";
import { userService } from "@/services/user.service";
import { handleApiError, showSuccess } from "@/utils/error";

const UserProfilePage: React.FC = () => {
  const { user, loadUserInfo } = useAuth();
  const [form] = Form.useForm<UpdateUserRequest>();

  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: UpdateUserRequest) => {
    if (!user) return;
    try {
      await userService.updateUser(user.id, {
        username: values.username,
        email: values.email,
      });
      await loadUserInfo();
      showSuccess("Cập nhật thông tin tài khoản thành công");
    } catch (error) {
      handleApiError(error);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-600">
        Không tìm thấy thông tin người dùng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
        <p className="text-sm text-gray-500">
          Cập nhật thông tin tài khoản của bạn.
        </p>
      </div>

      <Form<UpdateUserRequest>
        form={form}
        layout="vertical"
        initialValues={{
          username: user.username,
          email: user.email,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Tên đăng nhập"
          name="username"
          rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
        >
          <Input placeholder="Tên đăng nhập" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <input type="email" className="ant-input" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserProfilePage;
