import React, { useState, useEffect } from "react";
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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { productService } from "../../../services/product.service";
import { categoryService } from "../../../services/category.service";
import type { CreateProductRequest } from "../../../services/product.service";
import { extractErrorMessage } from "../../../utils/error";
import type { Category } from "@/types/category.types";
import type { RcFile } from "antd/es/upload";

interface ProductCreateProps {
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

const ProductCreate: React.FC<ProductCreateProps> = ({
  isOpenCreateModal,
  setIsOpenCreateModal,
  reload,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryService.getAllCategories({
          page: 1,
          size: 100,
          isActive: true,
        });
        if (response && response.result) {
          setCategories(response.result);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    if (isOpenCreateModal) {
      fetchCategories();
    }
  }, [isOpenCreateModal]);

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

    // Tạo preview từ local
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedFiles((prev) => [...prev, file]);
      const uploadFile: UploadFile = {
        uid: `-${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "done",
        url: result,
        originFileObj: file as RcFile,
      };
      setFileList((prev) => [...prev, uploadFile]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    try {
      const response = await productService.uploadThumbnail(file);
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
    }
  };

  const uploadProps = {
    beforeUpload: handleFileSelect,
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
      // Cập nhật selectedFiles khi xóa file
      const remainingFiles = newFileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File);
      setSelectedFiles(remainingFiles);
    },
    onRemove: (file: UploadFile) => {
      if (file.originFileObj) {
        setSelectedFiles((prev) =>
          prev.filter((f) => f !== file.originFileObj)
        );
      }
      return true;
    },
    multiple: true,
  };

  const onFinish = async (values: CreateProductRequest) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const uploadedUrls: string[] = [];

      // Upload tất cả ảnh lên server
      if (selectedFiles.length > 0) {
        const totalFiles = selectedFiles.length;
        for (let i = 0; i < totalFiles; i++) {
          const file = selectedFiles[i];
          const url = await handleUpload(file);
          if (url) {
            uploadedUrls.push(url);
          }
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      }

      if (selectedFiles.length > 0 && uploadedUrls.length === 0) {
        setUploading(false);
        return; // Tất cả upload đều thất bại
      }

      // Lấy ảnh đầu tiên làm thumbnail
      const productData: CreateProductRequest = {
        ...values,
        thumbnailUrl:
          uploadedUrls.length > 0 ? uploadedUrls[0] : values.thumbnailUrl,
        isActive: values.isActive ?? true,
        isFeatured: values.isFeatured ?? false,
        categoryIds: values.categoryIds || [],
      };
      await productService.createProduct(productData);

      api.success({
        message: "Thành công",
        description: "Tạo mới sản phẩm thành công",
        placement: "topRight",
      });
      setIsOpenCreateModal(false);
      form.resetFields();
      setFileList([]);
      setSelectedFiles([]);
      reload();
    } catch (error: unknown) {
      const { message, errorCode, isAccessDenied } = extractErrorMessage(error);
      api.error({
        message: isAccessDenied ? "Không có quyền" : errorCode || "Lỗi",
        description: message,
        placement: "topRight",
        duration: isAccessDenied ? 6 : 5,
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const onReset = () => {
    form.resetFields();
    setFileList([]);
    setSelectedFiles([]);
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="Tạo mới sản phẩm"
        open={isOpenCreateModal}
        onClose={() => {
          setIsOpenCreateModal(false);
        }}
        width="60%"
      >
        <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
          <Form.Item
            label="Tên"
            name="name"
            rules={[
              { required: true, message: "Tên sản phẩm không được để trống" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="SKU" name="sku">
            <Input />
          </Form.Item>

          <Form.Item label="Thương hiệu" name="brand">
            <Input />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Giá" name="price">
            <InputNumber<number>
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                const cleaned = value?.replace(/\$\s?|(,*)/g, "") || "";
                return cleaned ? Number(cleaned) : 0;
              }}
              min={0}
            />
          </Form.Item>

          <Form.Item label="Giá giảm" name="discountPrice">
            <InputNumber<number>
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                const cleaned = value?.replace(/\$\s?|(,*)/g, "") || "";
                return cleaned ? Number(cleaned) : 0;
              }}
              min={0}
            />
          </Form.Item>

          <Form.Item label="Số lượng" name="stockQuantity">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="Màu sắc" name="color">
            <Input />
          </Form.Item>

          <Form.Item label="Kích thước" name="size">
            <Input />
          </Form.Item>

          <Form.Item label="Trọng lượng" name="weight">
            <Input />
          </Form.Item>

          <Form.Item label="Kích thước (DxRxC)" name="dimensions">
            <Input />
          </Form.Item>

          <Form.Item label="Thông số kỹ thuật" name="specifications">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Danh mục" name="categoryIds">
            <Select
              mode="multiple"
              placeholder="Chọn danh mục"
              loading={loadingCategories}
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Hình ảnh" name="thumbnailUrl">
            <Upload {...uploadProps} listType="picture-card">
              {fileList.length >= 10 ? null : (
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
                  Đang upload {selectedFiles.length} ảnh lên server... (
                  {uploadProgress}%)
                </p>
              </div>
            )}
            <div style={{ marginTop: 8, color: "#999", fontSize: "12px" }}>
              Có thể upload nhiều ảnh (tối đa 10 ảnh). Ảnh đầu tiên sẽ được dùng
              làm thumbnail.
            </div>
          </Form.Item>

          <Form.Item label="Nổi bật" name="isFeatured" initialValue={false}>
            <Select placeholder="Chọn trạng thái nổi bật">
              <Select.Option value={true}>Có</Select.Option>
              <Select.Option value={false}>Không</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Trạng thái" name="isActive" initialValue={true}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                disabled={uploading}
              >
                Tạo
              </Button>
              <Button htmlType="button" onClick={onReset} disabled={uploading}>
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default ProductCreate;
