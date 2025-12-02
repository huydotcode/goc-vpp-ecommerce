import React, { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  notification,
  Select,
  Space,
  Upload,
  Progress,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { categoryService } from "../../../services/category.service";
import type {
  UpdateCategoryRequest,
  CategoryDTO,
} from "../../../services/category.service";
import { extractErrorMessage } from "../../../utils/error";
import type { RcFile } from "antd/es/upload";

interface CategoryUpdateProps {
  isOpenUpdateModal: boolean;
  setIsOpenUpdateModal: (v: boolean) => void;
  reload: () => void;
  dataDetailModal: CategoryDTO | null;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 20 },
};

const CategoryUpdate: React.FC<CategoryUpdateProps> = ({
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string>("");

  useEffect(() => {
    if (dataDetailModal) {
      form.setFieldsValue({
        name: dataDetailModal.name,
        description: dataDetailModal.description,
        isActive: dataDetailModal.isActive,
        thumbnailUrl: dataDetailModal.thumbnailUrl,
      });
      setExistingThumbnailUrl(dataDetailModal.thumbnailUrl || "");
      if (dataDetailModal.thumbnailUrl) {
        setFileList([
          {
            uid: "-1",
            name: "thumbnail.png",
            status: "done",
            url: dataDetailModal.thumbnailUrl,
          },
        ]);
      }
      setSelectedFile(null);
    }
  }, [dataDetailModal, form]);

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
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await categoryService.uploadThumbnail(
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
      if (existingThumbnailUrl) {
        setFileList([
          {
            uid: "-1",
            name: "thumbnail.png",
            status: "done",
            url: existingThumbnailUrl,
          },
        ]);
      }
      return true;
    },
    maxCount: 1,
  };

  const onFinish = async (values: UpdateCategoryRequest) => {
    if (!dataDetailModal) return;

    try {
      let thumbnailUrl = values.thumbnailUrl || existingThumbnailUrl;

      // Upload ảnh lên server nếu có file mới được chọn
      if (selectedFile) {
        const uploadedUrl = await handleUpload(selectedFile);
        if (!uploadedUrl) {
          return; // Upload thất bại, dừng lại
        }
        thumbnailUrl = uploadedUrl;
      }

      const categoryData: UpdateCategoryRequest = {
        ...values,
        thumbnailUrl,
      };
      await categoryService.updateCategory(dataDetailModal.id, categoryData);
      api.success({
        message: "Thành công",
        description: "Cập nhật danh mục thành công",
        placement: "topRight",
      });
      setIsOpenUpdateModal(false);
      form.resetFields();
      setFileList([]);
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
        title="Cập nhật danh mục"
        open={isOpenUpdateModal}
        onClose={() => setIsOpenUpdateModal(false)}
        width="60%"
        placement="left"
      >
        <Form
          {...layout}
          form={form}
          name="update-category-form"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
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
                <p style={{ marginTop: 8, color: "var(--color-gray-500)" }}>
                  Đang upload ảnh lên server...
                </p>
              </div>
            )}
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
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                disabled={uploading}
              >
                Cập nhật
              </Button>
              <Button
                htmlType="button"
                onClick={() => form.resetFields()}
                disabled={uploading}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default CategoryUpdate;
