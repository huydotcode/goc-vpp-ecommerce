import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  notification,
  Select,
  Space,
  Upload,
  Progress,
  Card,
  DatePicker,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import type {
  PromotionDTO,
  UpdatePromotionRequest,
  ConditionGroupDTO,
  GiftItemDTO,
} from "../../../services/promotion.service";
import { promotionService } from "../../../services/promotion.service";
import { productService } from "../../../services/product.service";
import type { ProductDTO } from "../../../services/product.service";
import { extractErrorMessage } from "../../../utils/error";
import type { RcFile } from "antd/es/upload";
import type {
  PromotionConditionDetailRequest,
  PromotionConditionOperator,
} from "@/types/promotion.types";

interface PromotionUpdateProps {
  isOpenUpdateModal: boolean;
  setIsOpenUpdateModal: (v: boolean) => void;
  reload: () => void;
  dataDetailModal: PromotionDTO | null;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

const PromotionUpdate: React.FC<PromotionUpdateProps> = ({
  isOpenUpdateModal,
  setIsOpenUpdateModal,
  reload,
  dataDetailModal,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [conditionGroups, setConditionGroups] = useState<ConditionGroupDTO[]>([]);
  const [giftItems, setGiftItems] = useState<GiftItemDTO[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getAllProducts({
          page: 1,
          size: 1000,
          isActive: true,
        });
        if (response && response.result) {
          setProducts(response.result);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isOpenUpdateModal) {
      fetchProducts();
    }
  }, [isOpenUpdateModal]);

  useEffect(() => {
    if (dataDetailModal && isOpenUpdateModal) {
      // Set Form Values
      form.setFieldsValue({
        name: dataDetailModal.name,
        slug: dataDetailModal.slug,
        description: dataDetailModal.description,
        discountType: dataDetailModal.discountType,
        discountAmount: dataDetailModal.discountAmount,
        isActive: dataDetailModal.isActive,
        thumbnailUrl: dataDetailModal.thumbnailUrl,
        dateRange: (dataDetailModal.startDate || dataDetailModal.endDate)
          ? [dataDetailModal.startDate ? dayjs(dataDetailModal.startDate) : null,
          dataDetailModal.endDate ? dayjs(dataDetailModal.endDate) : null]
          : null,
      });

      // Set Thumbnail
      setThumbnailUrl(dataDetailModal.thumbnailUrl || "");
      if (dataDetailModal.thumbnailUrl) {
        setFileList([
          {
            uid: "-1",
            name: "thumbnail.png",
            status: "done",
            url: dataDetailModal.thumbnailUrl,
          },
        ]);
      } else {
        setFileList([]);
      }

      // Set Condition Groups
      if (dataDetailModal.conditions) {
        const groups = dataDetailModal.conditions.map(c => ({
          operator: c.operator as PromotionConditionOperator,
          details: c.details.map(d => ({
            productId: d.productId,
            requiredQuantity: d.requiredQuantity
          }))
        }));
        setConditionGroups(groups);
      } else {
        setConditionGroups([]);
      }

      // Set Gift Items
      if (dataDetailModal.giftItems) {
        const gifts = dataDetailModal.giftItems.map(g => ({
          productId: g.productId,
          quantity: g.quantity
        }));
        setGiftItems(gifts);
      } else {
        setGiftItems([]);
      }
    }
  }, [dataDetailModal, isOpenUpdateModal, form]);

  const handleFileSelect = (file: File): boolean => {
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

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedFile(file);
      const uploadFile: UploadFile = {
        uid: "-1",
        name: file.name,
        status: "done",
        url: result,
        originFileObj: file as RcFile,
      };
      setFileList([uploadFile]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await promotionService.uploadThumbnail(
        file,
        dataDetailModal?.id
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.secureUrl) {
        return response.secureUrl;
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
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const uploadProps = {
    beforeUpload: handleFileSelect,
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
      if (newFileList.length === 0) {
        setSelectedFile(null);
      }
    },
    onRemove: () => {
      setSelectedFile(null);
      return true;
    },
    maxCount: 1,
  };

  // --- Condition Logic ---
  const addConditionGroup = () => {
    setConditionGroups((prev) => [
      ...prev,
      {
        operator: "ALL",
        details: [{ productId: 0, requiredQuantity: 1 }],
      },
    ]);
  };

  const removeConditionGroup = (index: number) => {
    setConditionGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const updateConditionGroup = (
    index: number,
    field: "operator" | "details",
    value: PromotionConditionOperator | PromotionConditionDetailRequest[] | undefined
  ) => {
    setConditionGroups((prev) => {
      const newGroups = [...prev];
      if (field === "operator") {
        newGroups[index] = {
          ...newGroups[index],
          operator: value as PromotionConditionOperator,
        };
      } else {
        newGroups[index] = {
          ...newGroups[index],
          details: value as PromotionConditionDetailRequest[],
        };
      }
      return newGroups;
    });
  };

  const addConditionDetail = (groupIndex: number) => {
    setConditionGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        details: [
          ...newGroups[groupIndex].details,
          { productId: 0, requiredQuantity: 1 },
        ],
      };
      return newGroups;
    });
  };

  const removeConditionDetail = (groupIndex: number, detailIndex: number) => {
    setConditionGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        details: newGroups[groupIndex].details.filter(
          (_, i) => i !== detailIndex
        ),
      };
      return newGroups;
    });
  };

  const updateConditionDetail = (
    groupIndex: number,
    detailIndex: number,
    field: "productId" | "requiredQuantity",
    value: number
  ) => {
    setConditionGroups((prev) => {
      const newGroups = [...prev];
      const newDetails = [...newGroups[groupIndex].details];
      newDetails[detailIndex] = { ...newDetails[detailIndex], [field]: value };
      newGroups[groupIndex] = { ...newGroups[groupIndex], details: newDetails };
      return newGroups;
    });
  };

  // --- Gift Logic ---
  const addGiftItem = () => {
    setGiftItems((prev) => [...prev, { productId: 0, quantity: 1 }]);
  };

  const removeGiftItem = (index: number) => {
    setGiftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGiftItem = (
    index: number,
    field: "productId" | "quantity",
    value: number
  ) => {
    setGiftItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const onFinish = async (values: any) => {
    if (!dataDetailModal) return;

    try {
      // Validate conditions
      const validConditionGroups = conditionGroups.filter(
        (group) =>
          group.details.length > 0 &&
          group.details.every((d) => d.productId > 0 && d.requiredQuantity > 0)
      );

      if (validConditionGroups.length === 0) {
        api.error({
          message: "Lỗi",
          description: "Vui lòng thêm ít nhất một nhóm điều kiện hợp lệ",
          placement: "topRight",
        });
        return;
      }

      // Validate gift items if GIFT type
      if (values.discountType === "GIFT") {
        const validGiftItems = giftItems.filter(
          (item) => item.productId > 0 && item.quantity > 0
        );
        if (validGiftItems.length === 0) {
          api.error({
            message: "Lỗi",
            description: "Vui lòng thêm ít nhất một sản phẩm tặng kèm",
            placement: "topRight",
          });
          return;
        }
      }

      let finalThumbnailUrl = thumbnailUrl;
      if (selectedFile) {
        const uploadedUrl = await handleUpload(selectedFile);
        if (!uploadedUrl) return;
        finalThumbnailUrl = uploadedUrl;
      }

      const promotionData: UpdatePromotionRequest = {
        ...values,
        thumbnailUrl: finalThumbnailUrl,
        discountAmount: values.discountAmount
          ? Number(values.discountAmount)
          : undefined,
        startDate: values.dateRange && values.dateRange[0] ? dayjs(values.dateRange[0]).toISOString() : undefined,
        endDate: values.dateRange && values.dateRange[1] ? dayjs(values.dateRange[1]).toISOString() : undefined,
        conditions: validConditionGroups,
        giftItems: values.discountType === "GIFT"
          ? giftItems.filter(
            (item) => item.productId > 0 && item.quantity > 0
          )
          : [],
      };

      await promotionService.updatePromotion(dataDetailModal.id, promotionData);

      api.success({
        message: "Thành công",
        description: "Cập nhật khuyến mãi thành công",
        placement: "topRight",
      });
      setIsOpenUpdateModal(false);
      form.resetFields();
      setFileList([]);
      setThumbnailUrl("");
      setSelectedFile(null);
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

  return (
    <>
      {contextHolder}
      <Drawer
        title="Cập nhật khuyến mãi"
        open={isOpenUpdateModal}
        onClose={() => setIsOpenUpdateModal(false)}
        width="70%"
      >
        <Form
          {...layout}
          form={form}
          name="update-promotion-form"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên khuyến mãi" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            tooltip="Đường dẫn URL cho trang khuyến mãi (để trống sẽ tự động tạo từ tên)"
          >
            <Input placeholder="vd: khuyen-mai-giam-gia-50" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Loại giảm giá"
            name="discountType"
            rules={[{ required: true, message: "Vui lòng chọn loại giảm giá" }]}
          >
            <Select
              placeholder="Chọn loại giảm giá"
              onChange={(value) => {
                if (value === "GIFT") {
                  // Keep existing gifts if switching back, or initialize empty if none
                  if (giftItems.length === 0) setGiftItems([{ productId: 0, quantity: 1 }]);
                } else {
                  // Don't clear immediately to avoid accidental data loss? 
                  // Actually create modal clears it. Let's consistency.
                  setGiftItems([]);
                }
              }}
            >
              <Select.Option value="DISCOUNT_AMOUNT">Giảm giá</Select.Option>
              <Select.Option value="GIFT">Quà tặng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.discountType !== currentValues.discountType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("discountType") === "DISCOUNT_AMOUNT" ? (
                <Form.Item
                  label="Số tiền giảm"
                  name="discountAmount"
                  rules={[
                    { required: true, message: "Số tiền giảm là bắt buộc" },
                    {
                      type: "number",
                      min: 1,
                      message: "Số tiền giảm phải lớn hơn 0",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(displayValue: string | undefined): number => {
                      const cleaned =
                        displayValue?.replace(/\$\s?|(,*)/g, "") || "";
                      return cleaned ? Number(cleaned) : 0;
                    }}
                    min={0}
                    placeholder="Nhập số tiền giảm (VND)"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* Helper for Conditions */}
          <Form.Item label="Điều kiện">
            <div>
              {conditionGroups.map((group, groupIndex) => (
                <Card
                  key={groupIndex}
                  title={`Nhóm điều kiện ${groupIndex + 1}`}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeConditionGroup(groupIndex)}
                    >
                      Xóa nhóm
                    </Button>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Form.Item label="Toán tử" style={{ marginBottom: 16 }}>
                    <Select
                      value={group.operator}
                      onChange={(value) =>
                        updateConditionGroup(groupIndex, "operator", value)
                      }
                    >
                      <Select.Option value="ALL">Tất cả (ALL)</Select.Option>
                      <Select.Option value="ANY">Bất kỳ (ANY)</Select.Option>
                    </Select>
                  </Form.Item>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>
                      Chi tiết điều kiện:
                    </div>
                    {group.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 8,
                          alignItems: "flex-end",
                        }}
                      >
                        <Form.Item
                          label="Sản phẩm"
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Select
                            value={detail.productId || undefined}
                            onChange={(value) =>
                              updateConditionDetail(
                                groupIndex,
                                detailIndex,
                                "productId",
                                value
                              )
                            }
                            placeholder="Chọn sản phẩm"
                            loading={loadingProducts}
                            showSearch
                            filterOption={(input, option) => {
                              const children = option?.children;
                              const text = Array.isArray(children) ? children.join(' ') : String(children || '');
                              return text.toLowerCase().includes(input.toLowerCase());
                            }}
                          >
                            {products.map((product) => (
                              <Select.Option
                                key={product.id}
                                value={product.id}
                              >
                                {product.id} - {product.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          label="Số lượng"
                          style={{ width: 150, marginBottom: 0 }}
                        >
                          <InputNumber
                            value={detail.requiredQuantity}
                            onChange={(value) =>
                              updateConditionDetail(
                                groupIndex,
                                detailIndex,
                                "requiredQuantity",
                                value || 1
                              )
                            }
                            min={1}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            removeConditionDetail(groupIndex, detailIndex)
                          }
                        >
                          Xóa
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addConditionDetail(groupIndex)}
                      block
                    >
                      Thêm sản phẩm
                    </Button>
                  </div>
                </Card>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addConditionGroup}
                block
                style={{ marginBottom: 16 }}
              >
                Thêm nhóm điều kiện
              </Button>
            </div>
          </Form.Item>

          {/* Helper for Gifts */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.discountType !== currentValues.discountType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("discountType") === "GIFT" ? (
                <Form.Item label="Quà tặng">
                  <div>
                    {giftItems.map((item, index) => (
                      <Card
                        key={index}
                        title={`Quà tặng ${index + 1}`}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeGiftItem(index)}
                          >
                            Xóa
                          </Button>
                        }
                        style={{ marginBottom: 16 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-end",
                          }}
                        >
                          <Form.Item
                            label="Sản phẩm"
                            style={{ flex: 1, marginBottom: 0 }}
                          >
                            <Select
                              value={item.productId || undefined}
                              onChange={(value) =>
                                updateGiftItem(index, "productId", value)
                              }
                              placeholder="Chọn sản phẩm"
                              loading={loadingProducts}
                              showSearch
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {products.map((product) => (
                                <Select.Option
                                  key={product.id}
                                  value={product.id}
                                >
                                  {product.id} - {product.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="Số lượng"
                            style={{ width: 150, marginBottom: 0 }}
                          >
                            <InputNumber
                              value={item.quantity}
                              onChange={(value) =>
                                updateGiftItem(index, "quantity", value || 1)
                              }
                              min={1}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </div>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addGiftItem}
                      block
                      style={{ marginBottom: 16 }}
                    >
                      Thêm quà tặng
                    </Button>
                  </div>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="Thumbnail" name="thumbnailUrl">
            <Upload {...uploadProps} listType="picture-card">
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            {uploading && (
              <div style={{ marginTop: 16 }}>
                <Progress percent={uploadProgress} status="active" />
                <p style={{ marginTop: 8, color: "#666" }}>
                  Đang upload ảnh lên server...
                </p>
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="Thời gian khuyến mãi"
            name="dateRange"
            tooltip="Chọn thời gian bắt đầu và kết thúc (để trống = không giới hạn thời gian)"
          >
            <DatePicker.RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="isActive"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading} disabled={uploading}>
                Cập nhật
              </Button>
              <Button htmlType="button" onClick={() => form.resetFields()} disabled={uploading}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default PromotionUpdate;
