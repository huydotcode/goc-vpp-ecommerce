import AddressSelector from "@/components/checkout/AddressSelector";
import { useAuth } from "@/contexts/AuthContext";
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/services/user.service";
import { userService } from "@/services/user.service";
import { userAddressService } from "@/services/userAddress.service";
import type { UserAddress } from "@/types/user.types";
import { handleApiError } from "@/utils/error";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  PhoneOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ProfileFormValues = Omit<UpdateProfileRequest, "dateOfBirth"> & {
  dateOfBirth?: Dayjs | null;
};

const { Title, Text } = Typography;

const UserProfilePage: React.FC = () => {
  const { user, loadUserInfo, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, modalContextHolder] = Modal.useModal();
  const [form] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<ChangePasswordRequest>();
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null
  );

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        gender: user.gender || undefined,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
    }
  }, [user, form]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await userAddressService.getMyAddresses();
      setAddresses(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const dob = values.dateOfBirth
        ? values.dateOfBirth.format("YYYY-MM-DD")
        : undefined;
      const emailChanged = values.email && values.email !== user.email;
      await userService.updateProfile({
        username: values.username,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: dob,
      });
      if (emailChanged) {
        toast.success(
          "Đổi email thành công. Bạn sẽ được đăng xuất để dùng email mới."
        );
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 3000);
      } else {
        await loadUserInfo();
        toast.success("Cập nhật thông tin thành công!");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: ChangePasswordRequest) => {
    setChangingPassword(true);
    try {
      await userService.changePassword(values);
      passwordForm.resetFields();
      toast.success("Đổi mật khẩu thành công");
    } catch (error) {
      handleApiError(error);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAddress = (address: UserAddress) => {
    modal.confirm({
      title: "Xóa địa chỉ",
      content: "Bạn có chắc chắn muốn xóa địa chỉ này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await userAddressService.deleteAddress(address.id);
          toast.success("Đã xóa địa chỉ");
          await loadAddresses();
        } catch (error) {
          handleApiError(error);
        }
      },
    });
  };

  const handleSetDefaultAddress = async (address: UserAddress) => {
    try {
      await userAddressService.setDefaultAddress(address.id);
      toast.success("Đã đặt làm địa chỉ mặc định");
      await loadAddresses();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAddressSelect = async (address: UserAddress) => {
    setEditingAddress(address);
    setAddressSelectorOpen(false);
    await loadAddresses();
  };

  const buildAddressDisplay = (address: UserAddress): string => {
    if (address.fullAddress) {
      return address.fullAddress;
    }

    const parts: string[] = [];
    if (address.street) parts.push(address.street);
    if (address.wardName) parts.push(address.wardName);
    if (address.districtName) parts.push(address.districtName);
    if (address.provinceName) parts.push(address.provinceName);

    return parts.length > 0 ? parts.join(", ") : "Địa chỉ";
  };

  if (!user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-600">
        Không tìm thấy thông tin người dùng.
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col gap-4">
      {modalContextHolder}
      <div>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          Thông tin cá nhân
        </Title>
      </div>

      {/* Basic Info Form */}
      <Card title="Thông tin cơ bản">
        <Form<ProfileFormValues>
          form={form}
          layout="horizontal"
          labelAlign="left"
          labelCol={{ xs: { span: 24 }, sm: { span: 7 }, lg: { span: 6 } }}
          wrapperCol={{ xs: { span: 24 }, sm: { span: 17 }, lg: { span: 18 } }}
          initialValues={{
            username: user.username,
            email: user.email,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            gender: user.gender || undefined,
            dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
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
            <Input type="email" placeholder="Email" />
          </Form.Item>

          <Form.Item
            label="Họ"
            name="lastName"
            rules={[{ max: 100, message: "Tối đa 100 ký tự" }]}
          >
            <Input placeholder="Họ" />
          </Form.Item>

          <Form.Item
            label="Tên"
            name="firstName"
            rules={[{ max: 100, message: "Tối đa 100 ký tự" }]}
          >
            <Input placeholder="Tên" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              {
                pattern: /^[0-9+\-\s()]{6,20}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item label="Giới tính" name="gender">
            <Select
              allowClear
              options={[
                { label: "Nam", value: "MALE" },
                { label: "Nữ", value: "FEMALE" },
                { label: "Khác", value: "OTHER" },
              ]}
              placeholder="Chọn giới tính"
            />
          </Form.Item>

          <Form.Item label="Ngày sinh" name="dateOfBirth">
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              placeholder="Chọn ngày sinh"
            />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              xs: { span: 24 },
              sm: { span: 17, offset: 7 },
              lg: { span: 18, offset: 6 },
            }}
          >
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Address Management Section */}
      <Card
        title="Địa chỉ của bạn"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAddress(null);
              setAddressSelectorOpen(true);
            }}
          >
            Thêm địa chỉ
          </Button>
        }
      >
        {loadingAddresses ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : addresses.length === 0 ? (
          <Empty
            description="Bạn chưa có địa chỉ nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingAddress(null);
                setAddressSelectorOpen(true);
              }}
            >
              Thêm địa chỉ đầu tiên
            </Button>
          </Empty>
        ) : (
          <div className="space-y-4 flex flex-col gap-2">
            {addresses.map((address) => (
              <Card
                key={address.id}
                size="small"
                style={{
                  border: address.isDefault
                    ? "1px solid #1890ff"
                    : "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <HomeOutlined />
                      <Text strong>{buildAddressDisplay(address)}</Text>
                      {address.isDefault && (
                        <Tag color="blue" icon={<CheckOutlined />}>
                          Mặc định
                        </Tag>
                      )}
                    </div>
                    {address.phone && (
                      <Text type="secondary" style={{ display: "block" }}>
                        <PhoneOutlined /> {address.phone}
                      </Text>
                    )}
                  </div>
                  <Space>
                    {!address.isDefault && (
                      <Button
                        size="small"
                        onClick={() => handleSetDefaultAddress(address)}
                      >
                        Đặt mặc định
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingAddress(address);
                        setAddressSelectorOpen(true);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAddress(address)}
                    >
                      Xóa
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Change Password */}
      <Card title="Đổi mật khẩu">
        <Form<ChangePasswordRequest>
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
            ]}
          >
            <Input.Password placeholder="Mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
            ]}
          >
            <Input.Password placeholder="Mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={changingPassword}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Address Selector Drawer */}
      <AddressSelector
        open={addressSelectorOpen}
        onClose={() => {
          setAddressSelectorOpen(false);
          setEditingAddress(null);
        }}
        onSelect={handleAddressSelect}
        selectedAddressId={editingAddress?.id || null}
        editingAddress={editingAddress}
        enableSelection={false}
      />
    </div>
  );
};

export default UserProfilePage;
