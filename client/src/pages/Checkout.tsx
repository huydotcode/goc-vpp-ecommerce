import type { CartItem } from "@/types/cart.types";
import type { UserAddress } from "@/types/user.types";
import { EnvironmentOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Image,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { paymentApi } from "../api/payment.api";
import AddressSelector from "../components/checkout/AddressSelector";
import { useAuth } from "../contexts/AuthContext";
import { useCart, useCheckout } from "../hooks";
import {
  addressService,
  type AddressData,
  type District,
  type Province,
  type Ward,
} from "../services/address.service";
import { userAddressService } from "../services/userAddress.service";
import { PaymentMethod } from "../types/order.types";
import { formatCurrency } from "../utils/format";

const { Title, Text } = Typography;

// Helper function to build full address from UserAddress
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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, isLoading: cartLoading } = useCart();
  const checkoutMutation = useCheckout();
  const { user, isAuthenticated } = useAuth();
  const [form] = Form.useForm();

  const selectedCartItemIds = (
    location.state as { selectedCartItemIds?: number[] }
  )?.selectedCartItemIds;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.PAYOS
  );
  const [loading, setLoading] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);

  const isCheckingOutRef = useRef(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (provinces.length > 0 && districts.length === 0 && wards.length === 0) {
      if (isAuthenticated) {
        loadUserInfoAndAddresses();
        loadUserAddresses();
      } else {
        loadLastAddress();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length, isAuthenticated]);

  useEffect(() => {
    if (loading || checkoutMutation.isPending || isCheckingOutRef.current) {
      return;
    }

    if (!cartLoading && (!cart || cart.items.length === 0)) {
      toast.warning("Giỏ hàng trống");
      navigate("/cart");
    }
  }, [cart, cartLoading, navigate, loading, checkoutMutation.isPending]);

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

  const loadUserInfoAndAddresses = async () => {
    if (!user) return;

    if (user.username) {
      form.setFieldsValue({ fullName: user.username });
    }
    if (user.email) {
      form.setFieldsValue({ email: user.email });
    }
  };

  const loadUserAddresses = async () => {
    if (!isAuthenticated) return;

    try {
      const addresses = await userAddressService.getMyAddresses();

      // Đảm bảo mỗi address có fullAddress đầy đủ
      const addressesWithFullAddress = addresses.map((addr) => {
        if (!addr.fullAddress || addr.fullAddress.trim() === "") {
          const fullAddress = addressService.buildFullAddress({
            street: addr.street || "",
            ward: addr.wardName || "",
            district: addr.districtName || "",
            province: addr.provinceName || "",
          });
          return { ...addr, fullAddress };
        }
        return addr;
      });

      setUserAddresses(addressesWithFullAddress);

      // Tự động chọn địa chỉ mặc định nếu có
      const defaultAddress = addressesWithFullAddress.find(
        (addr) => addr.isDefault
      );
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        await fillFormFromAddress(defaultAddress);
      } else if (addressesWithFullAddress.length > 0) {
        // Nếu không có default, chọn địa chỉ đầu tiên
        setSelectedAddress(addressesWithFullAddress[0]);
        await fillFormFromAddress(addressesWithFullAddress[0]);
      } else {
        // Không có địa chỉ nào
        setSelectedAddress(null);
        loadLastAddress();
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setSelectedAddress(null);
      loadLastAddress();
    }
  };

  const fillFormFromAddress = async (address: UserAddress) => {
    if (address.phone) {
      form.setFieldsValue({ phone: address.phone });
    }

    if (address.provinceCode && address.provinceName) {
      const fullAddr =
        address.fullAddress ||
        addressService.buildFullAddress({
          street: address.street || "",
          ward: address.wardName || "",
          district: address.districtName || "",
          province: address.provinceName || "",
        });

      form.setFieldsValue({
        street: address.street || "",
        address: fullAddr,
        province: address.provinceCode,
      });

      await handleProvinceChange(address.provinceCode, {
        preserveAddress: true,
      });

      setTimeout(async () => {
        if (address.districtCode) {
          form.setFieldsValue({ district: address.districtCode });
          await handleDistrictChange(address.districtCode, {
            preserveAddress: true,
          });

          setTimeout(() => {
            if (address.wardCode) {
              form.setFieldsValue({
                ward: address.wardCode,
                address: fullAddr,
              });
            }
          }, 300);
        }
      }, 300);
    }
  };

  const handleAddressSelect = async (address: UserAddress) => {
    if (!address.fullAddress || address.fullAddress.trim() === "") {
      const fullAddress = addressService.buildFullAddress({
        street: address.street || "",
        ward: address.wardName || "",
        district: address.districtName || "",
        province: address.provinceName || "",
      });
      address.fullAddress = fullAddress;
    }

    setSelectedAddress(address);
    await fillFormFromAddress(address);
    await loadUserAddresses();
  };

  const loadLastAddress = async () => {
    const lastAddress = addressService.getLastAddress();
    if (lastAddress && lastAddress.province) {
      const province = provinces.find((p) => p.name === lastAddress.province);
      if (province) {
        form.setFieldsValue({
          street: lastAddress.street,
          address: addressService.buildFullAddress(lastAddress),
        });

        await handleProvinceChange(province.code);

        setTimeout(async () => {
          const district = districts.find(
            (d) => d.name === lastAddress.district
          );
          if (district) {
            form.setFieldsValue({ district: district.code });
            await handleDistrictChange(district.code);

            setTimeout(() => {
              const ward = wards.find((w) => w.name === lastAddress.ward);
              if (ward) {
                form.setFieldsValue({ ward: ward.code });
              }
            }, 300);
          }
        }, 300);
      }
    }
  };

  const updateFullAddress = () => {
    const provinceCode = form.getFieldValue("province") as string;
    const districtCode = form.getFieldValue("district") as string;
    const wardCode = form.getFieldValue("ward") as string;
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

    form.setFieldsValue({ address: fullAddress });
  };

  const handleProvinceChange = async (
    provinceCode: string,
    options?: { preserveAddress?: boolean }
  ) => {
    form.setFieldsValue({
      district: undefined,
      ward: undefined,
      address: options?.preserveAddress ? form.getFieldValue("address") : "",
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

  const handleDistrictChange = async (
    districtCode: string,
    options?: { preserveAddress?: boolean }
  ) => {
    form.setFieldsValue({
      ward: undefined,
      address: options?.preserveAddress ? form.getFieldValue("address") : "",
    });
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

  const handleCheckout = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      isCheckingOutRef.current = true;

      let fullAddress = "";

      // Nếu đã chọn địa chỉ từ UserAddress, sử dụng địa chỉ đó
      if (isAuthenticated && selectedAddress) {
        fullAddress = selectedAddress.fullAddress || "";
      } else {
        // Build full address từ form
        const provinceName =
          provinces.find((p) => p.code === values.province)?.name || "";
        const districtName =
          districts.find((d) => d.code === values.district)?.name || "";
        const wardName = wards.find((w) => w.code === values.ward)?.name || "";
        const street = values.street || "";

        const addressData: AddressData = {
          province: provinceName,
          district: districtName,
          ward: wardName,
          street: street,
        };
        addressService.saveLastAddress(addressData);

        fullAddress =
          addressService.buildFullAddress(addressData) || values.address;
      }

      const itemsToCheckout = selectedCartItemIds
        ? cart!.items.filter((item) => selectedCartItemIds.includes(item.id))
        : cart!.items;
      const totalAmount = itemsToCheckout.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      const checkoutResponse = await checkoutMutation.mutateAsync({
        paymentMethod: paymentMethod,
        customerName: values.fullName,
        customerEmail: values.email,
        customerPhone: values.phone,
        address: fullAddress,
        description: values.notes || undefined,
        cartItemIds: selectedCartItemIds,
      });

      if (paymentMethod === PaymentMethod.PAYOS) {
        // Tạo payment link với PayOS
        const res = await paymentApi.createPayOSPayment({
          amount: Math.round(totalAmount),
          description:
            `Thanh toan don hang ${checkoutResponse.orderCode}`.substring(
              0,
              25
            ),
          orderCode: checkoutResponse.orderCode,
          customerName: values.fullName,
          customerEmail: values.email,
          customerPhone: values.phone,
        });

        const checkoutUrl = res.checkoutUrl || res.paymentUrl;

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          toast.error("Không lấy được URL thanh toán");
          isCheckingOutRef.current = false;
        }
      } else {
        // COD - redirect đến result page
        navigate(
          `/order-result?status=success&orderCode=${checkoutResponse.orderCode}&message=Đơn hàng COD đã được tạo thành công`
        );
      }
    } catch (error) {
      isCheckingOutRef.current = false;
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading || !cart || cart.items.length === 0) {
    return (
      <div style={{ padding: 24, minHeight: "60vh" }}>
        <Card loading={true} />
      </div>
    );
  }

  const itemsToDisplay = selectedCartItemIds
    ? cart.items.filter((item) => selectedCartItemIds.includes(item.id))
    : cart.items;
  const displayTotalAmount = itemsToDisplay.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const displayTotalItems = itemsToDisplay.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1200, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Thanh toán
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="Đơn hàng của bạn">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {itemsToDisplay.map((item: CartItem) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: "block", marginBottom: 4 }}>
                      {item.productName}
                    </Text>
                    {item.variantName && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: "block" }}
                      >
                        Phân loại: {item.variantName}{" "}
                        {item.sku ? `(${item.sku})` : ""}
                      </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </Text>
                    <Text strong style={{ display: "block", marginTop: 4 }}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                  </div>
                </div>
              ))}
              <Divider />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
                <Text strong>{formatCurrency(displayTotalAmount)}</Text>
              </div>

              {/* Display Promotions/Gifts only if full cart or if we assume promos apply */
                /* Since we don't have a calculate-preview API, we only show cart promos if checking out all items */
                (!selectedCartItemIds || (cart && selectedCartItemIds.length === cart.items.length)) && (
                  <>
                    {cart && cart.discountAmount && cart.discountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#52c41a" }}>
                        <Text type="success">Giảm giá:</Text>
                        <Text strong type="success">-{formatCurrency(cart.discountAmount)}</Text>
                      </div>
                    )}
                    {cart && cart.giftItems && cart.giftItems.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Text strong style={{ color: "#faad14" }}>Quà tặng kèm:</Text>
                        {cart.giftItems.map((gift, index) => (
                          <div key={index} style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                            {gift.productImageUrl && (
                              <Image src={gift.productImageUrl} width={30} height={30} style={{ borderRadius: 4 }} preview={false} />
                            )}
                            <Text style={{ fontSize: 13 }}>{gift.productName} (x{gift.quantity})</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              }

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
                  {
                    (!selectedCartItemIds || (cart && selectedCartItemIds.length === cart.items.length)) && cart && cart.finalAmount
                      ? formatCurrency(cart.finalAmount)
                      : formatCurrency(displayTotalAmount)
                  }
                </Text>
              </div>
              {selectedCartItemIds &&
                cart && selectedCartItemIds.length < cart.items.length && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    * Ưu đãi (nếu có) sẽ được tính lại dựa trên sản phẩm đã chọn khi tạo đơn hàng.
                  </Text>
                )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Thông tin giao hàng">
            <Form layout="vertical" form={form}>
              <Form.Item label="Địa chỉ giao hàng">
                {isAuthenticated ? (
                  <Card
                    hoverable
                    onClick={() => setAddressSelectorOpen(true)}
                    style={{
                      border: selectedAddress
                        ? "1px solid #1890ff"
                        : "1px solid #d9d9d9",
                      cursor: "pointer",
                    }}
                  >
                    {selectedAddress ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <EnvironmentOutlined style={{ color: "#1890ff" }} />
                          <Text strong>
                            {buildAddressDisplay(selectedAddress)}
                          </Text>
                          {selectedAddress.isDefault && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              Mặc định
                            </Tag>
                          )}
                        </div>
                        {selectedAddress.phone && (
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            📞 {selectedAddress.phone}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "16px 0",
                          color: "#1890ff",
                        }}
                      >
                        <EnvironmentOutlined
                          style={{ fontSize: 24, marginBottom: 8 }}
                        />
                        <div>
                          <Text type="secondary">
                            {userAddresses.length > 0
                              ? "Chọn hoặc thêm địa chỉ"
                              : "Thêm địa chỉ giao hàng"}
                          </Text>
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      background: "#f5f5f5",
                      borderRadius: 8,
                      textAlign: "center",
                    }}
                  >
                    <Text type="secondary">
                      Vui lòng đăng nhập để lưu địa chỉ
                    </Text>
                  </div>
                )}
              </Form.Item>

              <Form.Item
                label="Họ tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              {(!isAuthenticated || !selectedAddress) && (
                <>
                  <Form.Item
                    label="Tỉnh/Thành phố"
                    name="province"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn tỉnh/thành phố",
                      },
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
                    name="district"
                    rules={[
                      { required: true, message: "Vui lòng chọn quận/huyện" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn quận/huyện"
                      loading={loadingDistricts}
                      disabled={!form.getFieldValue("province")}
                      onChange={(value) => {
                        handleDistrictChange(value);
                        setTimeout(() => updateFullAddress(), 100);
                      }}
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
                    name="ward"
                    rules={[
                      { required: true, message: "Vui lòng chọn phường/xã" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn phường/xã"
                      loading={loadingWards}
                      disabled={!form.getFieldValue("district")}
                      onChange={() => {
                        setTimeout(() => updateFullAddress(), 100);
                      }}
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
                </>
              )}

              <Form.Item label="Địa chỉ đầy đủ" name="address">
                <Input.TextArea
                  placeholder="Địa chỉ sẽ tự động điền khi chọn tỉnh/quận/phường"
                  rows={2}
                  readOnly
                />
              </Form.Item>

              <Form.Item label="Ghi chú" name="notes">
                <Input.TextArea
                  placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                label="Phương thức thanh toán"
                name="paymentMethod"
                initialValue={PaymentMethod.PAYOS}
              >
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Radio value={PaymentMethod.PAYOS}>
                    Thanh toán qua PayOS
                  </Radio>
                  <Radio value={PaymentMethod.COD}>
                    Thanh toán bằng tiền mặt
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading || checkoutMutation.isPending}
                  onClick={handleCheckout}
                >
                  {paymentMethod === PaymentMethod.PAYOS
                    ? "Thanh toán qua PayOS"
                    : "Đặt hàng"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Address Selector Drawer */}
      {isAuthenticated && (
        <AddressSelector
          open={addressSelectorOpen}
          onClose={() => setAddressSelectorOpen(false)}
          onSelect={handleAddressSelect}
          selectedAddressId={selectedAddress?.id || null}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
