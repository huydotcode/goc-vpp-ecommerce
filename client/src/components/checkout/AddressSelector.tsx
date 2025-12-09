import React, { useEffect, useState } from "react";
import {
  Drawer,
  Space,
  Typography,
  Button,
  Form,
  Input,
  Select,
  Card,
  Divider,
  Tag,
  Empty,
  Spin,
  Checkbox,
  Modal,
} from "antd";
import {
  PlusOutlined,
  CheckOutlined,
  HomeOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { userAddressService } from "@/services/userAddress.service";
import {
  addressService,
  type Province,
  type District,
  type Ward,
} from "@/services/address.service";
import type { UserAddress, UpdateAddressRequest } from "@/types/user.types";

const { Text, Title } = Typography;

interface AddressSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (address: UserAddress) => void;
  selectedAddressId?: number | null;
  editingAddress?: UserAddress | null;
  enableSelection?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  open,
  onClose,
  onSelect,
  selectedAddressId,
  editingAddress,
  enableSelection = true,
}) => {
  const [modal, modalContextHolder] = Modal.useModal();
  const [mode, setMode] = useState<"select" | "add">(
    enableSelection ? "select" : "add"
  );
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Sync local selectedId when parent changes / drawer opens
    if (open) {
      setSelectedId(enableSelection ? (selectedAddressId ?? null) : null);
    }
    if (open) {
      loadAddresses();
      if (!enableSelection) {
        setMode("add");
        loadProvinces();
      } else if (mode === "add" || editingAddress) {
        loadProvinces();
      }
      // If editing, switch to add mode and fill form
      if (editingAddress) {
        setMode("add");
        fillFormFromAddress(editingAddress);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingAddress]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const addresses = await userAddressService.getMyAddresses();
      setUserAddresses(addresses);
    } catch (error) {
      console.error("Error loading addresses:", error);
      toast.error("Không tải được danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch {
      toast.error("Không tải được danh sách tỉnh/thành phố");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceChange = async (provinceCode: string) => {
    form.setFieldsValue({
      districtCode: undefined,
      wardCode: undefined,
      fullAddress: "",
    });
    setDistricts([]);
    setWards([]);

    if (!provinceCode) return;

    setLoadingDistricts(true);
    try {
      const data = await addressService.getDistricts(provinceCode);
      setDistricts(data);
    } catch {
      toast.error("Không tải được danh sách quận/huyện");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    form.setFieldsValue({ wardCode: undefined, fullAddress: "" });
    setWards([]);

    if (!districtCode) return;

    setLoadingWards(true);
    try {
      const data = await addressService.getWards(districtCode);
      setWards(data);
    } catch {
      toast.error("Không tải được danh sách phường/xã");
    } finally {
      setLoadingWards(false);
    }
  };

  const updateFullAddress = () => {
    const provinceCode = form.getFieldValue("provinceCode") as string;
    const districtCode = form.getFieldValue("districtCode") as string;
    const wardCode = form.getFieldValue("wardCode") as string;
    const street = (form.getFieldValue("street") as string) || "";

    const provinceName =
      provinces.find((p) => p.code === provinceCode)?.name || "";
    const districtName =
      districts.find((d) => d.code === districtCode)?.name || "";
    const wardName = wards.find((w) => w.code === wardCode)?.name || "";

    const fullAddress = addressService.buildFullAddress({
      street,
      ward: wardName,
      district: districtName,
      province: provinceName,
    });

    form.setFieldsValue({ fullAddress });
  };

  const fillFormFromAddress = async (address: UserAddress) => {
    if (!address) return;

    form.setFieldsValue({
      phone: address.phone || "",
      provinceCode: address.provinceCode || undefined,
      districtCode: address.districtCode || undefined,
      wardCode: address.wardCode || undefined,
      street: address.street || "",
      fullAddress: address.fullAddress || "",
      isDefault: address.isDefault || false,
    });

    // Load districts and wards if province/district codes exist
    if (address.provinceCode) {
      await handleProvinceChange(address.provinceCode);
      if (address.districtCode) {
        setTimeout(async () => {
          await handleDistrictChange(address.districtCode!);
        }, 300);
      }
    }
  };

  const handleAddAddress = async (values: UpdateAddressRequest) => {
    setSaving(true);
    try {
      const provinceName =
        provinces.find((p) => p.code === values.provinceCode)?.name || "";
      const districtName =
        districts.find((d) => d.code === values.districtCode)?.name || "";
      const wardName =
        wards.find((w) => w.code === values.wardCode)?.name || "";

      const fullAddress = addressService.buildFullAddress({
        street: values.street || "",
        ward: wardName,
        district: districtName,
        province: provinceName,
      });

      const addressData = {
        ...values,
        fullAddress,
        provinceName,
        districtName,
        wardName,
      };

      let updatedAddress: UserAddress;
      if (editingAddress?.id) {
        // Update existing address
        updatedAddress = await userAddressService.updateAddress(
          editingAddress.id,
          addressData
        );
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        // Create new address
        updatedAddress = await userAddressService.createAddress(addressData);
        toast.success("Thêm địa chỉ thành công");
      }

      await loadAddresses();
      setMode("select");
      form.resetFields();
      onSelect(updatedAddress);
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(
        editingAddress?.id
          ? "Không thể cập nhật địa chỉ"
          : "Không thể thêm địa chỉ"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddress = (address: UserAddress) => {
    if (!enableSelection) return;
    setSelectedId(address.id ?? null);
  };

  const handleUseSelected = () => {
    const chosen = userAddresses.find((a) => a.id === selectedId);
    if (chosen) {
      onSelect(chosen);
      onClose();
    } else {
      toast.error("Vui lòng chọn một địa chỉ");
    }
  };

  return (
    <Drawer
      title={
        editingAddress
          ? "Chỉnh sửa địa chỉ"
          : enableSelection
            ? "Chọn địa chỉ giao hàng"
            : "Thêm địa chỉ mới"
      }
      open={open}
      onClose={onClose}
      width={720}
      extra={
        enableSelection ? (
          mode === "select" ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setMode("add");
                loadProvinces();
              }}
            >
              Thêm địa chỉ mới
            </Button>
          ) : (
            <Button onClick={() => setMode("select")}>Quay lại</Button>
          )
        ) : null
      }
    >
      {modalContextHolder}
      {!enableSelection ? (
        <Form
          layout="vertical"
          form={form}
          onFinish={handleAddAddress}
          autoComplete="off"
        >
          <Title level={5}>Thông tin địa chỉ</Title>
          <Divider />
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            label="Tỉnh/Thành phố"
            name="provinceCode"
            rules={[
              { required: true, message: "Vui lòng chọn tỉnh/thành phố" },
            ]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              loading={loadingProvinces}
              onChange={(value) => {
                handleProvinceChange(value);
                setTimeout(() => updateFullAddress(), 100);
              }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={provinces.map((p) => ({
                label: p.name,
                value: p.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Quận/Huyện"
            name="districtCode"
            rules={[{ required: true, message: "Vui lòng chọn quận/huyện" }]}
          >
            <Select
              placeholder="Chọn quận/huyện"
              loading={loadingDistricts}
              onChange={(value) => {
                handleDistrictChange(value);
                setTimeout(() => updateFullAddress(), 100);
              }}
              disabled={!form.getFieldValue("provinceCode")}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={districts.map((d) => ({
                label: d.name,
                value: d.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Phường/Xã"
            name="wardCode"
            rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              loading={loadingWards}
              onChange={() => setTimeout(() => updateFullAddress(), 100)}
              disabled={!form.getFieldValue("districtCode")}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={wards.map((w) => ({
                label: w.name,
                value: w.code,
              }))}
            />
          </Form.Item>
          <Form.Item label="Địa chỉ (đường, số nhà)" name="street">
            <Input
              placeholder="Số nhà, tên đường"
              onChange={() => setTimeout(() => updateFullAddress(), 100)}
            />
          </Form.Item>
          <Form.Item label="Địa chỉ đầy đủ" name="fullAddress">
            <Input.TextArea
              rows={2}
              placeholder="Địa chỉ đầy đủ sẽ được tự động gợi ý"
            />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
            </Button>
          </Space>
        </Form>
      ) : mode === "select" ? (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
            </div>
          ) : userAddresses.length > 0 ? (
            <>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                {userAddresses.map((address) => (
                  <Card
                    key={address.id}
                    hoverable
                    style={{
                      border:
                        enableSelection && selectedId === address.id
                          ? "2px solid #111827" // gray-900
                          : "1px solid #e5e7eb", // gray-200
                      boxShadow: "none",
                      cursor: enableSelection ? "pointer" : "default",
                      transition: "border-color 0.2s ease",
                    }}
                    onClick={() => {
                      if (enableSelection) handleSelectAddress(address);
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        padding: "2px 0",
                      }}
                    >
                      {enableSelection && (
                        <Checkbox
                          checked={selectedId === address.id}
                          onChange={() => handleSelectAddress(address)}
                          style={{ marginTop: 4 }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <Text
                            strong
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <HomeOutlined style={{ marginRight: 4 }} />
                            {address.fullAddress || "Địa chỉ"}
                          </Text>
                          {address.isDefault && (
                            <Tag color="blue">Mặc định</Tag>
                          )}
                        </div>
                        {address.phone && (
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 14,
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <PhoneOutlined />
                            {address.phone}
                          </Text>
                        )}
                        {enableSelection && selectedId === address.id && (
                          <Tag color="green" icon={<CheckOutlined />}>
                            Đã chọn
                          </Tag>
                        )}
                      </div>
                      <div>
                        <Button
                          danger
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            modal.confirm({
                              title: "Xóa địa chỉ",
                              content: "Bạn có chắc chắn muốn xóa địa chỉ này?",
                              okText: "Xóa",
                              okType: "danger",
                              cancelText: "Hủy",
                              centered: true,
                              onOk: async () => {
                                try {
                                  await userAddressService.deleteAddress(
                                    address.id
                                  );
                                  toast.success("Đã xóa địa chỉ");
                                  await loadAddresses();
                                  if (selectedId === address.id) {
                                    setSelectedId(null);
                                  }
                                } catch (err) {
                                  console.error("Delete address error", err);
                                  toast.error("Xóa địa chỉ thất bại");
                                }
                              },
                            });
                          }}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
              <Divider style={{ margin: "16px 0" }} />
              {enableSelection ? (
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Button
                    onClick={() => setMode("add")}
                    icon={<PlusOutlined />}
                  >
                    Thêm địa chỉ mới
                  </Button>
                  <Space>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button
                      type="primary"
                      onClick={handleUseSelected}
                      disabled={!selectedId}
                    >
                      Dùng địa chỉ này
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Button
                    onClick={() => setMode("add")}
                    icon={<PlusOutlined />}
                  >
                    Thêm địa chỉ mới
                  </Button>
                  <Button onClick={onClose}>Đóng</Button>
                </Space>
              )}
            </>
          ) : (
            <Empty
              description="Bạn chưa có địa chỉ nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setMode("add");
                  loadProvinces();
                }}
              >
                Thêm địa chỉ mới
              </Button>
            </Empty>
          )}
        </div>
      ) : (
        <Form
          layout="vertical"
          form={form}
          onFinish={handleAddAddress}
          autoComplete="off"
        >
          <Title level={5}>Thông tin địa chỉ</Title>
          <Divider />

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Tỉnh/Thành phố"
            name="provinceCode"
            rules={[
              { required: true, message: "Vui lòng chọn tỉnh/thành phố" },
            ]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              loading={loadingProvinces}
              onChange={(value) => {
                handleProvinceChange(value);
                setTimeout(() => updateFullAddress(), 100);
              }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={provinces.map((p) => ({
                value: p.code,
                label: p.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Quận/Huyện"
            name="districtCode"
            rules={[{ required: true, message: "Vui lòng chọn quận/huyện" }]}
          >
            <Select
              placeholder="Chọn quận/huyện"
              loading={loadingDistricts}
              onChange={(value) => {
                handleDistrictChange(value);
                setTimeout(() => updateFullAddress(), 100);
              }}
              disabled={!form.getFieldValue("provinceCode")}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={districts.map((d) => ({
                value: d.code,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            name="wardCode"
            rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              loading={loadingWards}
              onChange={() => {
                setTimeout(() => updateFullAddress(), 100);
              }}
              disabled={!form.getFieldValue("districtCode")}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={wards.map((w) => ({
                value: w.code,
                label: w.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Số nhà, tên đường"
            name="street"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số nhà, tên đường",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: 123 Nguyễn Văn A"
              onChange={() => updateFullAddress()}
            />
          </Form.Item>

          <Form.Item label="Địa chỉ đầy đủ" name="fullAddress">
            <Input.TextArea
              placeholder="Địa chỉ sẽ tự động điền"
              rows={2}
              readOnly
            />
          </Form.Item>

          <Form.Item
            name="isDefault"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                disabled={saving}
              >
                {editingAddress ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}
              </Button>
              <Button onClick={() => setMode("select")} disabled={saving}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
};

export default AddressSelector;
