import { Button, Card, Col, Form, Input, InputNumber, Radio, Row, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { paymentApi } from "../api/payment.api";
import { useNavigate } from "react-router-dom";
import { addressService, type Province, type District, type Ward, type AddressData } from "../services/address.service";

const CartVnPayMock: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"payos" | "cod">("payos");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const unitPrice = 1000;
  const amount = unitPrice * quantity;

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (provinces.length > 0 && districts.length === 0 && wards.length === 0) {
      loadLastAddress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch {
      message.error("Khong tai duoc danh sach tinh/thanh pho");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadLastAddress = async () => {
    const lastAddress = addressService.getLastAddress();
    if (lastAddress && lastAddress.province) {
      // Tìm lại code từ name (vì localStorage lưu name)
      const province = provinces.find((p) => p.name === lastAddress.province);
      if (province) {
        form.setFieldsValue({
          street: lastAddress.street,
          address: addressService.buildFullAddress(lastAddress),
        });
        
        await handleProvinceChange(province.code);
        
        // Đợi districts load xong
        setTimeout(async () => {
          const district = districts.find((d) => d.name === lastAddress.district);
          if (district) {
            form.setFieldsValue({ district: district.code });
            await handleDistrictChange(district.code);
            
            // Đợi wards load xong
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

  const handleProvinceChange = async (provinceCode: string) => {
    form.setFieldsValue({ district: undefined, ward: undefined, address: "" });
    setDistricts([]);
    setWards([]);

    if (!provinceCode) return;

    setLoadingDistricts(true);
    try {
      const data = await addressService.getDistricts(provinceCode);
      setDistricts(data);
    } catch {
      message.error("Khong tai duoc danh sach quan/huyen");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    form.setFieldsValue({ ward: undefined, address: "" });
    setWards([]);

    if (!districtCode) return;

    setLoadingWards(true);
    try {
      const data = await addressService.getWards(districtCode);
      setWards(data);
    } catch {
      message.error("Khong tai duoc danh sach phuong/xa");
    } finally {
      setLoadingWards(false);
    }
  };


  const handlePay = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (paymentMethod === "payos") {
        // PayOS yêu cầu description tối đa 25 ký tự
        const fullOrderInfo = `Thanh toan don hang PayOS cho ${values.fullName}`;
        const orderInfo = fullOrderInfo.length > 25 
          ? fullOrderInfo.substring(0, 25) 
          : fullOrderInfo;

        const res = await paymentApi.createPayOSPayment({
          amount,
          description: orderInfo,
          orderCode: String(Date.now()),
        });

        console.log("PayOS Response:", res);

        const checkoutUrl = res.checkoutUrl || res.paymentUrl;

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          console.error("Response không có checkoutUrl:", res);
          message.error("Khong lay duoc URL thanh toan. Vui long xem console.");
        }
      } else {
        // COD
        // Lấy tên từ code
        const provinceName = provinces.find((p) => p.code === values.province)?.name || "";
        const districtName = districts.find((d) => d.code === values.district)?.name || "";
        const wardName = wards.find((w) => w.code === values.ward)?.name || "";
        const street = values.street || "";

        // Lưu địa chỉ vào localStorage (lưu cả code và name)
        const addressData: AddressData = {
          province: provinceName,
          district: districtName,
          ward: wardName,
          street: street,
        };
        addressService.saveLastAddress(addressData);

        // Build full address từ tên
        const fullAddress = addressService.buildFullAddress({
          street,
          ward: wardName,
          district: districtName,
          province: provinceName,
        }) || values.address;

        const res = await paymentApi.createCODOrder({
          amount,
          description: `Don hang COD cho ${values.fullName}`,
          customerName: values.fullName,
          customerEmail: values.email,
          customerPhone: values.phone,
          address: fullAddress,
        });

        console.log("COD Response:", res);

        if (res.orderCode) {
          message.success(`Tao don hang COD thanh cong! Ma don: ${res.orderCode}`);
          navigate(`/payos-result?status=success&orderCode=${res.orderCode}&message=Don hang COD da duoc tao thanh cong`);
        } else {
          message.error("Khong tao duoc don hang COD");
        }
      }
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
      const errorMessage = paymentMethod === "payos" 
        ? "Co loi xay ra khi tao giao dich PayOS"
        : "Co loi xay ra khi tao don hang COD";
      message.error(errorMessage);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: 24 }}>
          Gio hang mock thanh toan
        </h1>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="San pham">
              <p>
                <strong>Ten:</strong> San pham demo PayOS
              </p>
              <p>
                <strong>Don gia:</strong> {unitPrice.toLocaleString("vi-VN")} VND
              </p>
              <div style={{ marginTop: 16 }}>
                <span style={{ marginRight: 8 }}>So luong:</span>
                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                />
              </div>
              <p style={{ marginTop: 16, fontWeight: "bold" }}>
                Tong tien: {amount.toLocaleString("vi-VN")} VND
              </p>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Thong tin khach hang">
              <Form layout="vertical" form={form}>
                <Form.Item
                  label="Phuong thuc thanh toan"
                  name="paymentMethod"
                  initialValue="payos"
                >
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <Radio value="payos">Thanh toan qua PayOS</Radio>
                    <Radio value="cod">Tra tien khi nhan hang (COD)</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="Ho ten"
                  name="fullName"
                  rules={[{ required: true, message: "Vui long nhap ho ten" }]}
                >
                  <Input placeholder="Nhap ho ten" />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui long nhap email" },
                    { type: "email", message: "Email khong hop le" },
                  ]}
                >
                  <Input placeholder="Nhap email" />
                </Form.Item>
                <Form.Item
                  label="So dien thoai"
                  name="phone"
                  rules={[{ required: true, message: "Vui long nhap so dien thoai" }]}
                >
                  <Input placeholder="Nhap so dien thoai" />
                </Form.Item>

                {paymentMethod === "cod" && (
                  <>
                    <Form.Item
                      label="Tinh/Thanh pho"
                      name="province"
                      rules={[{ required: true, message: "Vui long chon tinh/thanh pho" }]}
                    >
                      <Select
                        placeholder="Chon tinh/thanh pho"
                        loading={loadingProvinces}
                        onChange={handleProvinceChange}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={provinces.map((p) => ({
                          value: p.code,
                          label: p.name,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Quan/Huyen"
                      name="district"
                      rules={[{ required: true, message: "Vui long chon quan/huyen" }]}
                    >
                      <Select
                        placeholder="Chon quan/huyen"
                        loading={loadingDistricts}
                        onChange={handleDistrictChange}
                        disabled={!form.getFieldValue("province")}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={districts.map((d) => ({
                          value: d.code,
                          label: d.name,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Phuong/Xa"
                      name="ward"
                      rules={[{ required: true, message: "Vui long chon phuong/xa" }]}
                    >
                      <Select
                        placeholder="Chon phuong/xa"
                        loading={loadingWards}
                        disabled={!form.getFieldValue("district")}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        options={wards.map((w) => ({
                          value: w.code,
                          label: w.name,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label="So nha, ten duong"
                      name="street"
                      rules={[{ required: true, message: "Vui long nhap so nha, ten duong" }]}
                    >
                      <Input placeholder="Vi du: 123 Nguyen Van A" />
                    </Form.Item>

                    <Form.Item
                      label="Dia chi day du"
                      name="address"
                      shouldUpdate={(prevValues: Record<string, unknown>, currentValues: Record<string, unknown>) =>
                        (prevValues?.province as string ?? "") !== (currentValues?.province as string ?? "") ||
                        (prevValues?.district as string ?? "") !== (currentValues?.district as string ?? "") ||
                        (prevValues?.ward as string ?? "") !== (currentValues?.ward as string ?? "") ||
                        (prevValues?.street as string ?? "") !== (currentValues?.street as string ?? "")
                      }
                    >
                      {({ getFieldValue }) => {
                        const provinceCode = getFieldValue("province") as string;
                        const districtCode = getFieldValue("district") as string;
                        const wardCode = getFieldValue("ward") as string;
                        const street = (getFieldValue("street") as string) || "";

                        const provinceName = provinces.find((p) => p.code === provinceCode)?.name || "";
                        const districtName = districts.find((d) => d.code === districtCode)?.name || "";
                        const wardName = wards.find((w) => w.code === wardCode)?.name || "";

                        const fullAddress = addressService.buildFullAddress({
                          street,
                          ward: wardName,
                          district: districtName,
                          province: provinceName,
                        });

                        return (
                          <Input.TextArea 
                            placeholder="Dia chi se tu dong dien khi chon tinh/quan/phuong"
                            rows={2}
                            readOnly
                            value={fullAddress}
                          />
                        );
                      }}
                    </Form.Item>
                  </>
                )}

                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading}
                  onClick={handlePay}
                >
                  {paymentMethod === "payos" 
                    ? "Thanh toan qua PayOS" 
                    : "Dat hang COD"}
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CartVnPayMock;


