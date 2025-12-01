import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import {
  Button,
  Drawer,
  Form,
  Input,
  notification,
  Progress,
  Select,
  Space,
  Upload,
} from "antd";
import type { RcFile } from "antd/es/upload";
import React, { useState } from "react";
import type { CreateCategoryRequest } from "../../../services/category.service";
import { categoryService } from "../../../services/category.service";
import { extractErrorMessage } from "../../../utils/error";

interface CategoryCreateProps {
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

const CategoryCreate: React.FC<CategoryCreateProps> = ({
  isOpenCreateModal,
  setIsOpenCreateModal,
  reload,
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      // Simulate progress (vì axios không có built-in progress cho upload)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await categoryService.uploadThumbnail(file);
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

  const onFinish = async (values: CreateCategoryRequest) => {
    try {
      let thumbnailUrl = values.thumbnailUrl || "";

      // Upload ảnh lên server nếu có file được chọn
      if (selectedFile) {
        const uploadedUrl = await handleUpload(selectedFile);
        if (!uploadedUrl) {
          return; // Upload thất bại, dừng lại
        }
        thumbnailUrl = uploadedUrl;
      }

      const categoryData: CreateCategoryRequest = {
        ...values,
        thumbnailUrl,
        isActive: values.isActive ?? true,
      };
      await categoryService.createCategory(categoryData);
      api.success({
        message: "Thành công",
        description: "Tạo mới danh mục thành công",
        placement: "topRight",
      });
      setIsOpenCreateModal(false);
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

  const onReset = () => {
    form.resetFields();
    setFileList([]);
    setSelectedFile(null);
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="Tạo mới danh mục"
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
              { required: true, message: "Tên danh mục không được để trống" },
            ]}
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
                <p style={{ marginTop: 8, color: "#666" }}>
                  Đang upload ảnh lên server...
                </p>
              </div>
            )}
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

export default CategoryCreate;
