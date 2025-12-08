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
} from "antd";
import { PlusOutlined, CheckOutlined } from "@ant-design/icons";
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
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  open,
  onClose,
  onSelect,
  selectedAddressId,
}) => {
  const [mode, setMode] = useState<"select" | "add">("select");
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
      setSelectedId(selectedAddressId ?? null);
    }
    if (open) {
      loadAddresses();
      if (mode === "add") {
        loadProvinces();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

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

      const newAddress = await userAddressService.createAddress({
        ...values,
        fullAddress,
        provinceName,
        districtName,
        wardName,
      });

      toast.success("Thêm địa chỉ thành công");
      await loadAddresses();
      setMode("select");
      form.resetFields();
      onSelect(newAddress);
      onClose();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Không thể thêm địa chỉ");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddress = (address: UserAddress) => {
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
      title="Chọn địa chỉ giao hàng"
      open={open}
      onClose={onClose}
      width={720}
      extra={
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
      }
    >
      {mode === "select" ? (
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
                        selectedId === address.id
                          ? "2px solid #1890ff"
                          : "1px solid #d9d9d9",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <Checkbox
                        checked={selectedId === address.id}
                        onChange={() => handleSelectAddress(address)}
                        style={{ marginTop: 4 }}
                      />
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
                          <Text strong>{address.fullAddress || "Địa chỉ"}</Text>
                          {address.isDefault && (
                            <Tag color="blue">Mặc định</Tag>
                          )}
                          {selectedId === address.id && (
                            <Tag color="green" icon={<CheckOutlined />}>
                              Đã chọn
                            </Tag>
                          )}
                        </div>
                        {address.phone && (
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            📞 {address.phone}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
              <Divider style={{ margin: "16px 0" }} />
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Button onClick={() => setMode("add")} icon={<PlusOutlined />}>
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
                Lưu địa chỉ
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
