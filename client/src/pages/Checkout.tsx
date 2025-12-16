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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { savePayOSUrl } from "../utils/payosStorage";
import { promotionService } from "../services/promotion.service";
import type { PromotionResponse } from "@/types/promotion.types";
import { PromotionDiscountType } from "@/types/promotion.types";

// Define FormValues interface for type safety
interface FormValues {
  fullName?: string;
  email?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  address?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

// Custom hook for address form management
const useAddressForm = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const loadProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    try {
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch (error) {
      toast.error("Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.");
      console.error("Error loading provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const loadDistricts = useCallback(async (provinceCode: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    try {
      const data = await addressService.getDistricts(provinceCode);
      setDistricts(data);
    } catch (error) {
      toast.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      console.error("Error loading districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadWards = useCallback(async (districtCode: string) => {
    setLoadingWards(true);
    setWards([]);
    try {
      const data = await addressService.getWards(districtCode);
      setWards(data);
    } catch (error) {
      toast.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      console.error("Error loading wards:", error);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  const updateFullAddress = useCallback(
    (
      formValues: FormValues,
      provinces: Province[],
      districts: District[],
      wards: Ward[]
    ): string => {
      const provinceCode = formValues.province;
      const districtCode = formValues.district;
      const wardCode = formValues.ward;
      const street = formValues.street || "";

      const provinceName = provinceCode
        ? provinces.find((p) => p.code === provinceCode)?.name || ""
        : "";
      const districtName = districtCode
        ? districts.find((d) => d.code === districtCode)?.name || ""
        : "";
      const wardName = wardCode
        ? wards.find((w) => w.code === wardCode)?.name || ""
        : "";

      return addressService.buildFullAddress({
        street,
        ward: wardName,
        district: districtName,
        province: provinceName,
      });
    },
    []
  );

  return {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    setDistricts,
    setWards,
    loadProvinces,
    loadDistricts,
    loadWards,
    updateFullAddress,
  };
};

// Helper function to build full address display
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
  const [form] = Form.useForm<FormValues>();

  const selectedCartItemIds = (
    location.state as { selectedCartItemIds?: number[] }
  )?.selectedCartItemIds;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.PAYOS
  );
  const [loading, setLoading] = useState(false);
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);

  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );

  const isCheckingOutRef = useRef(false);
  const hasLoadedAddressesRef = useRef(false);
  const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>(
    []
  );

  // Get initial promotion selection from Cart if available
  const initialPromotionId = (
    location.state as { selectedPromotionId?: number | null }
  )?.selectedPromotionId || null;

  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(initialPromotionId);

  // Fetch Promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await promotionService.getActivePromotions();
        setActivePromotions(data);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      }
    };
    fetchPromotions();
  }, []);

  // Use custom hook for address management
  const {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    setDistricts,
    setWards,
    loadProvinces,
    loadDistricts,
    loadWards,
    updateFullAddress: updateFullAddressHelper,
  } = useAddressForm();

  // Performance: Memoize computed values
  const itemsToDisplay = useMemo(() => {
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds))
      return cart?.items || [];
    return (
      cart?.items.filter((item) => selectedCartItemIds.includes(item.id)) || []
    );
  }, [cart, selectedCartItemIds]);

  // Filter applicable promotions based on cart items
  const applicablePromotions = useMemo(() => {
    return activePromotions.filter((promo) => {
      // Only discount promotions can be selected
      if (promo.discountType !== PromotionDiscountType.DISCOUNT_AMOUNT) return false;
      if ((promo.discountAmount ?? 0) <= 0) return false;

      // Check if promotion conditions are satisfied
      if (!promo.conditions || promo.conditions.length === 0) {
        return true; // No conditions = applies to all
      }

      // Check if ALL condition groups are satisfied
      return promo.conditions.some((condGroup) => {
        if (condGroup.operator === "ALL") {
          // ALL: Every condition detail must be satisfied
          return condGroup.details.every((detail) => {
            const cartItem = itemsToDisplay.find(
              (item) => item.productId === detail.productId
            );
            // Check if item exists AND has enough quantity
            return cartItem && cartItem.quantity >= detail.requiredQuantity;
          });
        } else {
          // ANY: At least one condition detail must be satisfied
          return condGroup.details.some((detail) => {
            const cartItem = itemsToDisplay.find(
              (item) => item.productId === detail.productId
            );
            // Check if item exists AND has enough quantity
            return cartItem && cartItem.quantity >= detail.requiredQuantity;
          });
        }
      });
    });
  }, [activePromotions, itemsToDisplay]);

  // Identify the best promotion (highest discount)
  const bestPromotion = useMemo(() => {
    if (applicablePromotions.length === 0) return null;
    return applicablePromotions.reduce((best, current) => {
      const bestAmount = best.discountAmount ?? 0;
      const currentAmount = current.discountAmount ?? 0;
      return currentAmount > bestAmount ? current : best;
    });
  }, [applicablePromotions]);

  // Auto-select best promotion on mount or when applicable promotions change
  // But only if no promotion was passed from Cart
  useEffect(() => {
    if (bestPromotion && !selectedPromotionId && !initialPromotionId) {
      setSelectedPromotionId(bestPromotion.id);
    }
  }, [bestPromotion, selectedPromotionId, initialPromotionId]);

  // Clear selected promotion if it's no longer applicable
  useEffect(() => {
    if (
      selectedPromotionId &&
      !applicablePromotions.some((p) => p.id === selectedPromotionId)
    ) {
      setSelectedPromotionId(null);
    }
  }, [selectedPromotionId, applicablePromotions]);

  // Calculate total amount from items (using original prices)
  const displayTotalAmount = useMemo(
    () => itemsToDisplay.reduce((sum, item) => sum + item.subtotal, 0),
    [itemsToDisplay]
  );

  // Calculate order-level promotion discount (applied once, not per item)
  const selectedItemsDiscount = useMemo(() => {
    if (!selectedPromotionId) return 0;

    const selectedPromo = applicablePromotions.find(
      (p) => p.id === selectedPromotionId
    );

    if (!selectedPromo) return 0;

    // Check if promotion conditions are satisfied
    if (!selectedPromo.conditions || selectedPromo.conditions.length === 0) {
      // No conditions = applies to order
      return selectedPromo.discountAmount ?? 0;
    }

    // Check if items meet the promotion conditions (including quantity)
    const conditionsMet = selectedPromo.conditions.some((condGroup) => {
      if (condGroup.operator === "ALL") {
        // ALL: Every condition detail must be satisfied (product + quantity)
        return condGroup.details.every((detail) => {
          const cartItem = itemsToDisplay.find(
            (item) => item.productId === detail.productId
          );
          // Check if item exists AND has enough quantity
          return cartItem && cartItem.quantity >= detail.requiredQuantity;
        });
      } else {
        // ANY: At least one condition detail must be satisfied (product + quantity)
        return condGroup.details.some((detail) => {
          const cartItem = itemsToDisplay.find(
            (item) => item.productId === detail.productId
          );
          // Check if item exists AND has enough quantity
          return cartItem && cartItem.quantity >= detail.requiredQuantity;
        });
      }
    });

    return conditionsMet ? (selectedPromo.discountAmount ?? 0) : 0;
  }, [selectedPromotionId, applicablePromotions, itemsToDisplay]);

  // Validate selected cart items
  const validSelectedIds = useMemo(() => {
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds)) return [];
    return selectedCartItemIds.filter((id) =>
      cart?.items.some((item) => item.id === id)
    );
  }, [selectedCartItemIds, cart?.items]);

  useEffect(() => {
    // Don't show warning if currently checking out or if cart is loading
    if (
      loading ||
      checkoutMutation.isPending ||
      isCheckingOutRef.current ||
      cartLoading
    ) {
      return;
    }

    // Only show warning if:
    // 1. There are selectedCartItemIds
    // 2. Those items are no longer in cart
    // 3. Cart is not empty (if cart is empty, it might be due to successful checkout)
    if (
      selectedCartItemIds &&
      selectedCartItemIds.length > 0 &&
      validSelectedIds.length === 0 &&
      cart &&
      cart.items.length > 0
    ) {
      toast.warning("Các sản phẩm đã chọn không còn trong giỏ hàng");
      navigate("/cart");
    }
  }, [
    validSelectedIds,
    selectedCartItemIds,
    navigate,
    loading,
    checkoutMutation.isPending,
    cartLoading,
    cart,
  ]);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  // Track previous values to detect changes
  const prevAuthRef = useRef(isAuthenticated);
  const prevProvincesLengthRef = useRef(provinces.length);

  // Load user data when authenticated and provinces are loaded
  useEffect(() => {
    const authChanged = prevAuthRef.current !== isAuthenticated;
    const provincesChanged =
      prevProvincesLengthRef.current !== provinces.length;

    if (
      provinces.length > 0 &&
      (authChanged || provincesChanged || !hasLoadedAddressesRef.current)
    ) {
      hasLoadedAddressesRef.current = true;
      prevAuthRef.current = isAuthenticated;
      prevProvincesLengthRef.current = provinces.length;

      if (isAuthenticated) {
        loadUserInfoAndAddresses();
        loadUserAddresses();
      } else {
        loadLastAddress();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length, isAuthenticated]);

  // Watch cart changes for checkout
  useEffect(() => {
    if (loading || checkoutMutation.isPending || isCheckingOutRef.current) {
      return;
    }

    if (!cartLoading && (!cart || cart.items.length === 0)) {
      toast.warning("Giỏ hàng trống");
      navigate("/cart");
    }
  }, [cart, cartLoading, navigate, loading, checkoutMutation.isPending]);

  const loadUserInfoAndAddresses = useCallback(async () => {
    if (!user) return;

    if (user.username) {
      form.setFieldsValue({ fullName: user.username });
    }
    if (user.email) {
      form.setFieldsValue({ email: user.email });
    }
  }, [user, form]);

  const fillFormFromAddress = useCallback(
    async (address: UserAddress) => {
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

        // Sequential async loading without timeouts
        await loadDistricts(address.provinceCode);

        if (address.districtCode) {
          await loadWards(address.districtCode);
          form.setFieldsValue({
            district: address.districtCode,
            ward: address.wardCode || "",
            address: fullAddr,
          });
        }
      }
    },
    [form, loadDistricts, loadWards]
  );

  const loadUserAddresses = useCallback(async () => {
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
        // Don't call loadLastAddress here to avoid circular dependency
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setSelectedAddress(null);
      // Don't call loadLastAddress here to avoid circular dependency
    }
  }, [isAuthenticated, fillFormFromAddress]);

  const handleAddressSelect = async (address: UserAddress) => {
    try {
      // Ensure fullAddress is available
      let addressToUse = address;
      if (!address.fullAddress || address.fullAddress.trim() === "") {
        const fullAddress = addressService.buildFullAddress({
          street: address.street || "",
          ward: address.wardName || "",
          district: address.districtName || "",
          province: address.provinceName || "",
        });
        addressToUse = { ...address, fullAddress };
      }

      setSelectedAddress(addressToUse);
      await fillFormFromAddress(addressToUse);
    } catch (error) {
      console.error("Error in handleAddressSelect:", error);
      toast.error("Không thể cập nhật địa chỉ. Vui lòng thử lại.");
    } finally {
      setAddressSelectorOpen(false);
    }
  };

  const loadLastAddress = useCallback(async () => {
    const lastAddress = addressService.getLastAddress();
    if (lastAddress && lastAddress.province) {
      // Use current provinces from hook
      const province = provinces.find((p) => p.name === lastAddress.province);
      if (province) {
        form.setFieldsValue({
          street: lastAddress.street || "",
          address: addressService.buildFullAddress(lastAddress),
          province: province.code,
        });

        await loadDistricts(province.code);

        // Use a separate effect or callback to handle districts/wards after they load
        // For now, just set province and let user select district/ward manually
        // Or we can use a ref to track when districts are loaded
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loadDistricts]);

  const updateFullAddress = () => {
    const formValues = form.getFieldsValue();
    const fullAddress = updateFullAddressHelper(
      formValues,
      provinces,
      districts,
      wards
    );
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

    await loadDistricts(provinceCode);
    updateFullAddress();
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

    await loadWards(districtCode);
    updateFullAddress();
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
          addressService.buildFullAddress(addressData) || values.address || "";
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
        customerName: values.fullName || "",
        customerEmail: values.email || "",
        customerPhone: values.phone || "",
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
          customerName: values.fullName || "",
          customerEmail: values.email || "",
          customerPhone: values.phone || "",
        });

        const checkoutUrl = res.checkoutUrl || res.paymentUrl;

        if (checkoutUrl) {
          // Lưu checkoutUrl vào localStorage để có thể quay lại thanh toán sau
          savePayOSUrl(checkoutResponse.orderCode, checkoutUrl);

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

  // FIX: Properly destructure Title and Text from Typography
  const { Title, Text } = Typography;

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
                    <Text strong style={{ fontSize: 14 }}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                  </div>
                </div>
              ))}

              {/* Promotion Display - Read-only if selected from Cart, selectable if auto-selected */}
              {applicablePromotions.length > 0 && selectedPromotionId && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15 }}>
                    {initialPromotionId ? "Khuyến mãi đã chọn" : "Chọn khuyến mãi"}
                  </Text>
                  {initialPromotionId ? (
                    // Read-only display - promotion selected from Cart
                    (() => {
                      const selectedPromo = applicablePromotions.find(
                        (p) => p.id === selectedPromotionId
                      );
                      if (!selectedPromo) return null;

                      return (
                        <Card
                          size="small"
                          style={{
                            borderColor: "#1890ff",
                            backgroundColor: "#e6f7ff",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ fontSize: 14 }}>
                                {selectedPromo.name}
                              </Text>
                              <Tag color="blue" style={{ marginLeft: 8 }}>
                                Đã chọn
                              </Tag>
                              <div style={{ marginTop: 4 }}>
                                <Text style={{ fontSize: 13, color: "#ff4d4f" }}>
                                  Giảm {formatCurrency(selectedPromo.discountAmount ?? 0)}
                                </Text>
                              </div>
                              {selectedPromo.conditions && selectedPromo.conditions.length > 0 && (
                                <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Điều kiện:</Text>
                                  {selectedPromo.conditions.map((condGroup, idx) => (
                                    <div key={idx} style={{ marginLeft: 8, marginTop: 2 }}>
                                      {condGroup.operator === "ALL" ? "Tất cả: " : "Một trong: "}
                                      {condGroup.details.map((detail, detailIdx) => (
                                        <span key={detailIdx}>
                                          {detail.productName || `SP #${detail.productId}`} x{detail.requiredQuantity}
                                          {detailIdx < condGroup.details.length - 1 && ", "}
                                        </span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(selectedPromo.startDate || selectedPromo.endDate) && (
                                <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                                  {selectedPromo.startDate && selectedPromo.endDate ? (
                                    <>
                                      {new Date(selectedPromo.startDate).toLocaleDateString("vi-VN")} -{" "}
                                      {new Date(selectedPromo.endDate).toLocaleDateString("vi-VN")}
                                    </>
                                  ) : selectedPromo.startDate ? (
                                    <>Từ {new Date(selectedPromo.startDate).toLocaleDateString("vi-VN")}</>
                                  ) : selectedPromo.endDate ? (
                                    <>Đến {new Date(selectedPromo.endDate).toLocaleDateString("vi-VN")}</>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })()
                  ) : (
                    // Selectable promotions - auto-selected in checkout
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                      {applicablePromotions.map((promo) => {
                        const isBest = bestPromotion?.id === promo.id;
                        const isSelected = selectedPromotionId === promo.id;
                        return (
                          <Card
                            key={promo.id}
                            size="small"
                            hoverable
                            onClick={() => setSelectedPromotionId(promo.id)}
                            style={{
                              cursor: "pointer",
                              borderColor: isSelected ? "#1890ff" : "#d9d9d9",
                              borderWidth: isSelected ? 2 : 1,
                              backgroundColor: isSelected ? "#e6f7ff" : "white",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <Radio checked={isSelected} style={{ marginTop: 2 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <Text strong>{promo.name}</Text>
                                  {isBest && (
                                    <Tag color="gold" style={{ margin: 0 }}>
                                      Tốt nhất
                                    </Tag>
                                  )}
                                </div>
                                <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                                  Giảm {formatCurrency(promo.discountAmount ?? 0)}
                                </Text>
                                {/* Display Conditions */}
                                {promo.conditions && promo.conditions.length > 0 && (
                                  <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 500 }}>Điều kiện:</Text>
                                    {promo.conditions.map((condGroup, idx) => (
                                      <div key={idx} style={{ marginLeft: 8, marginTop: 2 }}>
                                        {condGroup.operator === "ALL" ? "Tất cả: " : "Một trong: "}
                                        {condGroup.details.map((detail, detailIdx) => (
                                          <span key={detailIdx}>
                                            {detail.productName || `SP #${detail.productId}`} x{detail.requiredQuantity}
                                            {detailIdx < condGroup.details.length - 1 && ", "}
                                          </span>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(promo.startDate || promo.endDate) && (
                                  <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                                    {promo.startDate && promo.endDate ? (
                                      <>
                                        {new Date(promo.startDate).toLocaleDateString("vi-VN")} -{" "}
                                        {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                                      </>
                                    ) : promo.startDate ? (
                                      <>Từ {new Date(promo.startDate).toLocaleDateString("vi-VN")}</>
                                    ) : promo.endDate ? (
                                      <>Đến {new Date(promo.endDate).toLocaleDateString("vi-VN")}</>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </Space>
                  )}
                </div>
              )}

              <Divider />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
                <Text strong>
                  {formatCurrency(displayTotalAmount + selectedItemsDiscount)}
                </Text>
              </div>

              {selectedItemsDiscount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#52c41a",
                  }}
                >
                  <Text type="success">Giảm giá:</Text>
                  <Text strong type="success">
                    -{formatCurrency(selectedItemsDiscount)}
                  </Text>
                </div>
              )}

              {/* Display Promotions/Gifts only if full cart or if we assume promos apply */}
              {(!selectedCartItemIds ||
                (cart && selectedCartItemIds.length === cart.items.length)) && (
                  <>
                    {cart && cart.discountAmount && cart.discountAmount > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          color: "#52c41a",
                        }}
                      >
                        <Text type="success">Giảm giá đơn hàng:</Text>
                        <Text strong type="success">
                          -{formatCurrency(cart.discountAmount)}
                        </Text>
                      </div>
                    )}
                    {cart && cart.giftItems && cart.giftItems.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Text strong style={{ color: "#faad14" }}>
                          Quà tặng kèm:
                        </Text>
                        {cart.giftItems.map((gift, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 4,
                              alignItems: "center",
                            }}
                          >
                            {gift.productImageUrl && (
                              <Image
                                src={gift.productImageUrl}
                                width={30}
                                height={30}
                                style={{ borderRadius: 4 }}
                                preview={false}
                              />
                            )}
                            <Text style={{ fontSize: 13 }}>
                              {gift.productName} (x{gift.quantity})
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong style={{ fontSize: 18 }}>
                  Tổng cộng:
                </Text>
                <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
                  {formatCurrency(
                    (!selectedCartItemIds ||
                      (cart &&
                        selectedCartItemIds.length === cart.items.length)) &&
                      cart &&
                      cart.finalAmount
                      ? cart.finalAmount
                      : displayTotalAmount
                  )}
                </Text>
              </div>
              {selectedCartItemIds &&
                cart &&
                selectedCartItemIds.length < cart.items.length && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    * Ưu đãi (nếu có) sẽ được tính lại dựa trên sản phẩm đã chọn
                    khi tạo đơn hàng.
                  </Text>
                )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Thông tin giao hàng">
            <Form
              layout="vertical"
              form={form}
              initialValues={{
                paymentMethod: PaymentMethod.PAYOS,
              }}
            >
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
                        // FIX: Remove setTimeout, call directly
                        updateFullAddress();
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
                        // FIX: Remove setTimeout, call directly
                        updateFullAddress();
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
                        // FIX: Remove setTimeout, call directly
                        updateFullAddress();
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
      {
        isAuthenticated && (
          <AddressSelector
            open={addressSelectorOpen}
            onClose={() => setAddressSelectorOpen(false)}
            onSelect={handleAddressSelect}
            selectedAddressId={selectedAddress?.id || null}
          />
        )
      }
    </div >
  );
};

export default CheckoutPage;
