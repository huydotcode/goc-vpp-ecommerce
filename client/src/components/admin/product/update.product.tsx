import React, { useEffect, useState } from "react";
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
  Alert,
} from "antd";
import { PlusOutlined, AppstoreOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { productService } from "../../../services/product.service";
import {
  categoryService,
  type CategoryDTO,
} from "../../../services/category.service";
import type {
  UpdateProductRequest,
  ProductDTO,
} from "../../../services/product.service";
import { extractErrorMessage } from "../../../utils/error";
import VariantManager from "./variant-manager.product";

interface ProductUpdateProps {
  isOpenUpdateModal: boolean;
  setIsOpenUpdateModal: (v: boolean) => void;
  reload: () => void;
  dataDetailModal: ProductDTO | null;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

const ProductUpdate: React.FC<ProductUpdateProps> = ({
  isOpenUpdateModal,
  setIsOpenUpdateModal,
  reload,
  dataDetailModal,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isVariantManagerVisible, setIsVariantManagerVisible] = useState(false);

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
    if (isOpenUpdateModal) {
      fetchCategories();
    }
  }, [isOpenUpdateModal]);

  useEffect(() => {
    if (dataDetailModal) {
      form.setFieldsValue({
        name: dataDetailModal.name,
        sku: dataDetailModal.sku,
        brand: dataDetailModal.brand,
        description: dataDetailModal.description,
        price: dataDetailModal.price,
        discountPrice: dataDetailModal.discountPrice,
        stockQuantity: dataDetailModal.stockQuantity,
        color: dataDetailModal.color,
        size: dataDetailModal.size,
        weight: dataDetailModal.weight,
        dimensions: dataDetailModal.dimensions,
        specifications: dataDetailModal.specifications,
        isActive: dataDetailModal.isActive,
        isFeatured: dataDetailModal.isFeatured,
        categoryIds: dataDetailModal.categories?.map((cat) => cat.id) || [],
        thumbnailUrl: dataDetailModal.thumbnailUrl,
      });

      // Load images từ images array hoặc thumbnailUrl
      const allImages: string[] = [];
      if (dataDetailModal.images && dataDetailModal.images.length > 0) {
        allImages.push(...dataDetailModal.images.map((img) => img.imageUrl));
      } else if (dataDetailModal.thumbnailUrl) {
        allImages.push(dataDetailModal.thumbnailUrl);
      }

      setImageUrls(allImages);

      // Set fileList cho Upload component
      const uploadFiles: UploadFile[] = allImages.map((url, index) => ({
        uid: `-${index}`,
        name: `image-${index}.png`,
        status: "done" as const,
        url: url,
      }));
      setFileList(uploadFiles);
    }
  }, [dataDetailModal, form]);

  const handleUpload = async (file: File): Promise<string | null> => {
    try {
      const response = await productService.uploadThumbnail(
        file,
        dataDetailModal?.id
      );
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
    beforeUpload: async (file: File) => {
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

      // Tạo preview local trước
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const uploadFile: UploadFile = {
          uid: `-${Date.now()}-${Math.random()}`,
          name: file.name,
          status: "uploading",
          url: previewUrl,
          originFileObj: file as any,
        };
        setFileList((prev) => [...prev, uploadFile]);
      };
      reader.readAsDataURL(file);

      // Upload lên server
      setUploading(true);
      const url = await handleUpload(file);
      if (url) {
        // Cập nhật fileList với URL từ server
        setFileList((prev) =>
          prev.map((f) => {
            if (f.originFileObj === file) {
              return {
                ...f,
                status: "done" as const,
                url: url,
              };
            }
            return f;
          })
        );
        // Cập nhật imageUrls
        setImageUrls((prev) => {
          if (!prev.includes(url)) {
            return [...prev, url];
          }
          return prev;
        });
        api.success({
          message: "Upload thành công",
          description: "Ảnh đã được upload thành công",
        });
      } else {
        // Xóa file khỏi fileList nếu upload thất bại
        setFileList((prev) => prev.filter((f) => f.originFileObj !== file));
      }
      setUploading(false);
      return false;
    },
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
      // Chỉ cập nhật imageUrls từ fileList nếu file đã upload thành công
      const urls = newFileList
        .filter((file) => file.status === "done" && file.url && !file.url.startsWith("data:"))
        .map((file) => file.url!);
      setImageUrls(urls);
    },
    onRemove: (file: UploadFile) => {
      if (file.url && !file.url.startsWith("data:")) {
        setImageUrls((prev) => prev.filter((url) => url !== file.url));
      }
      return true;
    },
    multiple: true,
  };

  const onFinish = async (values: UpdateProductRequest) => {
    if (!dataDetailModal) return;

    try {
      // Lấy ảnh đầu tiên làm thumbnail, các ảnh còn lại lưu vào images
      const productData: UpdateProductRequest = {
        ...values,
        thumbnailUrl: imageUrls.length > 0 ? imageUrls[0] : values.thumbnailUrl,
        categoryIds: values.categoryIds || [],
      };
      await productService.updateProduct(dataDetailModal.id, productData);

      // Sau khi update product thành công, upload các ảnh còn lại vào images array
      // (Nếu BE hỗ trợ upload images sau khi update product)

      api.success({
        message: "Thành công",
        description: "Cập nhật sản phẩm thành công",
        placement: "topRight",
      });
      setIsOpenUpdateModal(false);
      form.resetFields();
      setFileList([]);
      setImageUrls([]);
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
        title="Cập nhật sản phẩm"
        open={isOpenUpdateModal}
        onClose={() => {
          setIsOpenUpdateModal(false);
          setIsVariantManagerVisible(false);
        }}
        width="60%"
        placement="left"
        extra={
          dataDetailModal && (
            <Button
              type="primary"
              icon={<AppstoreOutlined />}
              onClick={() => setIsVariantManagerVisible(true)}
            >
              Quản lý Variant
            </Button>
          )
        }
      >
        <Alert
          message="Lưu ý về Variants"
          description="Sử dụng nút 'Quản lý Variant' ở góc trên để quản lý các variants (màu sắc, kích thước, chất liệu...). Các trường 'Màu sắc', 'Kích thước' bên dưới là để tương thích với dữ liệu cũ."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          {...layout}
          form={form}
          name="update-product-form"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
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
            <InputNumber<number> style={{ width: "100%" }} min={0} />
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
            <div style={{ marginTop: 8, color: "#999", fontSize: "12px" }}>
              Có thể upload nhiều ảnh (tối đa 10 ảnh). Ảnh đầu tiên sẽ được dùng
              làm thumbnail.
            </div>
          </Form.Item>

          <Form.Item label="Nổi bật" name="isFeatured">
            <Select placeholder="Chọn trạng thái nổi bật">
              <Select.Option value={true}>Có</Select.Option>
              <Select.Option value={false}>Không</Select.Option>
            </Select>
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
              <Button type="primary" htmlType="submit" loading={uploading}>
                Cập nhật
              </Button>
              <Button htmlType="button" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {dataDetailModal && (
        <VariantManager
          productId={dataDetailModal.id}
          productName={dataDetailModal.name}
          visible={isVariantManagerVisible}
          onClose={() => setIsVariantManagerVisible(false)}
        />
      )}
    </>
  );
};

export default ProductUpdate;
