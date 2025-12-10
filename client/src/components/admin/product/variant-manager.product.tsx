import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Table,
  Popconfirm,
  Image,
  ColorPicker,
  Switch,
  Upload,
  message,
  Tag,
} from "antd";
const { Compact } = Space;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload";
import { variantApi } from "../../../api/variant.api";
import type {
  ProductVariant,
  CreateVariantRequest,
  UpdateVariantRequest,
} from "../../../types/variant.types";
import { VariantType } from "../../../types/variant.types";
import { uploadApi } from "../../../api/upload.api";
import { extractErrorMessage } from "../../../utils/error";

interface VariantManagerProps {
  productId: number;
  productName?: string;
  visible: boolean;
  onClose: () => void;
}

const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  productName,
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [colorValue, setColorValue] = useState<string>("#000000");

  useEffect(() => {
    if (visible && productId) {
      loadVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await variantApi.getVariantsByProductId(productId);
      setVariants(data);
    } catch (error) {
      message.error("Không thể tải danh sách variant: " + extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVariant(null);
    form.resetFields();
    setImagePreviewUrl("");
    setFileList([]);
    setColorValue("#000000");
    form.setFieldsValue({
      productId,
      variantType: VariantType.COLOR,
      isActive: true,
      colorCode: undefined,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    const colorCode = variant.colorCode || "#000000";
    form.setFieldsValue({
      ...variant,
      colorCode: variant.colorCode || undefined,
    });
    setColorValue(colorCode);

    // Set image preview nếu có
    if (variant.imageUrl) {
      setImagePreviewUrl(variant.imageUrl);
      setFileList([
        {
          uid: `-${variant.id}`,
          name: `variant-image-${variant.id}.jpg`,
          status: "done" as const,
          url: variant.imageUrl,
        },
      ]);
    } else {
      setImagePreviewUrl("");
      setFileList([]);
    }

    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await variantApi.deleteVariant(id);
      message.success("Xóa variant thành công");
      loadVariants();
    } catch (error) {
      message.error("Không thể xóa variant: " + extractErrorMessage(error));
    }
  };

  const handleSubmit = async (values: CreateVariantRequest | UpdateVariantRequest) => {
    try {
      if (editingVariant) {
        const updateData: UpdateVariantRequest = {
          variantType: values.variantType || VariantType.COLOR,
          variantValue: values.variantValue || "",
          colorCode: values.colorCode || null,
          imageUrl: values.imageUrl || null,
          price: values.price || null,
          stockQuantity: values.stockQuantity || null,
          sku: values.sku || null,
          sortOrder: values.sortOrder || null,
          isActive: values.isActive !== false,
          isDefault: editingVariant.isDefault ?? false,
        };
        await variantApi.updateVariant(editingVariant.id!, updateData);
        message.success("Cập nhật variant thành công");
      } else {
        const createData: CreateVariantRequest = {
          productId,
          variantType: values.variantType || VariantType.COLOR,
          variantValue: values.variantValue || "",
          colorCode: values.colorCode || null,
          imageUrl: values.imageUrl || null,
          price: values.price || null,
          stockQuantity: values.stockQuantity || null,
          sku: values.sku || null,
          sortOrder: values.sortOrder || null,
          isActive: values.isActive !== false,
        };
        await variantApi.createVariant(createData);
        message.success("Tạo variant thành công");
      }
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      setImagePreviewUrl("");
      setColorValue("#000000");
      loadVariants();
    } catch (error) {
      message.error("Lỗi: " + extractErrorMessage(error));
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      const response = await uploadApi.upload(file, "image", "products");
      const url = response.secureUrl;
      setImagePreviewUrl(url);
      form.setFieldValue("imageUrl", url);
      return url;
    } catch (error) {
      message.error("Upload ảnh thất bại: " + extractErrorMessage(error));
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File): boolean => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file ảnh");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Kích thước file phải nhỏ hơn 5MB");
      return false;
    }

    // Tạo preview từ local
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const uploadFile: UploadFile = {
        uid: `-${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "uploading",
        url: result,
        originFileObj: file as RcFile,
      };
      setFileList([uploadFile]);
      setImagePreviewUrl(result);
    };
    reader.readAsDataURL(file);

    // Upload lên server
    handleImageUpload(file).then(() => {
      setFileList((prev) =>
        prev.map((f) => ({ ...f, status: "done" as const }))
      );
    }).catch(() => {
      setFileList([]);
      setImagePreviewUrl("");
    });

    return false;
  };

  const columns = [
    // Tạm thời ẩn cột Loại vì mặc định là Màu sắc
    // {
    //   title: "Loại",
    //   dataIndex: "variantType",
    //   key: "variantType",
    //   render: (type: VariantType) => (
    //     <Tag color="blue">{VariantTypeLabels[type]}</Tag>
    //   ),
    // },
    {
      title: "Giá trị",
      dataIndex: "variantValue",
      key: "variantValue",
    },
    {
      title: "Mã màu",
      dataIndex: "colorCode",
      key: "colorCode",
      render: (colorCode: string | null) =>
        colorCode ? (
          <Space>
            <div
              style={{
                width: 24,
                height: 24,
                backgroundColor: colorCode,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
              }}
            />
            <span>{colorCode}</span>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={50} height={50} style={{ objectFit: "cover" }} />
        ) : (
          "-"
        ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number | null) =>
        price ? price.toLocaleString("vi-VN") + " đ" : "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: ProductVariant) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa variant này?"
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`Quản lý Variant - ${productName || `Product #${productId}`}`}
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm Variant
          </Button>

          <Table
            columns={columns}
            dataSource={variants}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Space>
      </Modal>

      <Modal
        title={editingVariant ? "Sửa Variant" : "Thêm Variant"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setColorValue("#000000");
          setFileList([]);
          setImagePreviewUrl("");
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            variantType: VariantType.COLOR,
            isActive: true,
          }}
        >
          {/* Tạm thời ẩn loại variant, mặc định là COLOR */}
          <Form.Item
            name="variantType"
            hidden
            initialValue={VariantType.COLOR}
          >
            <input type="hidden" />
          </Form.Item>

          <Form.Item
            name="variantValue"
            label="Giá trị"
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
          >
            <Input placeholder="Ví dụ: Đỏ, XL, Cotton..." />
          </Form.Item>

          {/* Luôn hiển thị mã màu vì mặc định là COLOR */}
          <Form.Item
            name="colorCode"
            label="Mã màu (Hex)"
            rules={[
              {
                pattern: /^#[0-9A-Fa-f]{6}$/,
                message: "Mã màu phải là hex code (ví dụ: #FF0000)",
                validateTrigger: "onBlur",
              },
            ]}
          >
            <Compact>
              <ColorPicker
                showText={false}
                format="hex"
                value={colorValue}
                onChange={(color) => {
                  const hexValue = color.toHexString();
                  setColorValue(hexValue);
                  form.setFieldValue("colorCode", hexValue);
                  form.validateFields(["colorCode"]);
                }}
                onChangeComplete={(color) => {
                  const hexValue = color.toHexString();
                  setColorValue(hexValue);
                  form.setFieldValue("colorCode", hexValue);
                }}
                trigger="click"
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                    backgroundColor: colorValue,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </ColorPicker>
              <Input
                placeholder="Nhập mã màu hex (ví dụ: #FF0000)"
                style={{ flex: 1 }}
                value={form.getFieldValue("colorCode") || colorValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setColorValue(value || "#000000");
                  form.setFieldValue("colorCode", value);
                  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
                    form.setFields([
                      {
                        name: "colorCode",
                        errors: [],
                      },
                    ]);
                  }
                }}
              />
            </Compact>
          </Form.Item>

          <Form.Item name="imageUrl" label="URL ảnh">
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Input
                placeholder="Nhập URL hoặc upload ảnh"
                value={form.getFieldValue("imageUrl") || imagePreviewUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldValue("imageUrl", value);
                  setImagePreviewUrl(value);
                  if (!value) {
                    setFileList([]);
                  }
                }}
              />
              <Upload
                beforeUpload={handleFileSelect}
                fileList={fileList}
                onRemove={() => {
                  setFileList([]);
                  setImagePreviewUrl("");
                  form.setFieldValue("imageUrl", null);
                  return true;
                }}
                listType="picture-card"
                maxCount={1}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
              {imagePreviewUrl && (
                <div style={{ marginTop: 8 }}>
                  <Image
                    src={imagePreviewUrl}
                    alt="Preview"
                    width={100}
                    height={100}
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
            </Space>
          </Form.Item>

          <Form.Item name="price" label="Giá (nếu khác giá sản phẩm)">
            <InputNumber<number>
              style={{ width: "100%" }}
              placeholder="Để trống nếu dùng giá sản phẩm"
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                const cleaned = value?.replace(/\$\s?|(,*)/g, "") || "";
                return cleaned ? Number(cleaned) : 0;
              }}
            />
          </Form.Item>

          <Form.Item
            name="stockQuantity"
            label="Số lượng tồn kho"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng tồn kho" },
              { type: "number", min: 0, message: "Số lượng phải >= 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Số lượng riêng cho variant này"
            />
          </Form.Item>

          <Form.Item name="sku" label="SKU">
            <Input placeholder="SKU riêng cho variant (tùy chọn)" />
          </Form.Item>

          <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default VariantManager;

