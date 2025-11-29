import React, { useEffect, useState } from 'react';
import { Button, Drawer, Form, Input, InputNumber, notification, Select, Space, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { promotionService } from '../../../services/promotion.service';
import { productService } from '../../../services/product.service';
import type { UpdatePromotionRequest, PromotionDTO } from '../../../services/promotion.service';
import type { ProductDTO } from '../../../services/product.service';
import { extractErrorMessage } from '../../../utils/errorHandler';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getAllProducts({
          page: 1,
          size: 100,
          isActive: true,
        });
        if (response && response.result) {
          setProducts(response.result);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    if (isOpenUpdateModal) {
      fetchProducts();
    }
  }, [isOpenUpdateModal]);

  useEffect(() => {
    if (dataDetailModal) {
      form.setFieldsValue({
        name: dataDetailModal.name,
        description: dataDetailModal.description,
        discountType: dataDetailModal.discountType,
        discountAmount: dataDetailModal.discountAmount,
        isActive: dataDetailModal.isActive,
        thumbnailUrl: dataDetailModal.thumbnailUrl,
      });
      setThumbnailUrl(dataDetailModal.thumbnailUrl || '');
      if (dataDetailModal.thumbnailUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'thumbnail.png',
            status: 'done',
            url: dataDetailModal.thumbnailUrl,
          },
        ]);
      }
    }
  }, [dataDetailModal, form]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await promotionService.uploadThumbnail(file, dataDetailModal?.id);
      if (response.data?.secureUrl) {
        setThumbnailUrl(response.data.secureUrl);
        form.setFieldsValue({ thumbnailUrl: response.data.secureUrl });
        api.success({
          message: 'Upload thành công',
          description: 'Thumbnail đã được upload thành công',
        });
      } else {
        throw new Error('Không nhận được URL từ server');
      }
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || 'Upload thất bại',
        description: message,
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        api.error({
          message: 'Lỗi',
          description: 'Chỉ chấp nhận file ảnh',
        });
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        api.error({
          message: 'Lỗi',
          description: 'Kích thước file phải nhỏ hơn 5MB',
        });
        return false;
      }
      handleUpload(file);
      return false;
    },
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    maxCount: 1,
  };

  const onFinish = async (values: UpdatePromotionRequest) => {
    if (!dataDetailModal) return;

    try {
      const promotionData: UpdatePromotionRequest = {
        ...values,
        thumbnailUrl: thumbnailUrl || values.thumbnailUrl,
        discountAmount: values.discountAmount ? Number(values.discountAmount) : undefined,
      };
      await promotionService.updatePromotion(dataDetailModal.id, promotionData);
      api.success({
        message: 'Thành công',
        description: 'Cập nhật khuyến mãi thành công',
        placement: 'topRight',
      });
      setIsOpenUpdateModal(false);
      form.resetFields();
      setFileList([]);
      setThumbnailUrl('');
      reload();
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || 'Lỗi',
        description: message,
        placement: 'topRight',
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
        width="60%"
        placement="left"
      >
        <Form {...layout} form={form} name="update-promotion-form" onFinish={onFinish}>
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Loại giảm giá"
            name="discountType"
            rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
          >
            <Select placeholder="Chọn loại giảm giá">
              <Select.Option value="DISCOUNT_AMOUNT">Giảm giá</Select.Option>
              <Select.Option value="GIFT">Quà tặng</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số tiền giảm"
            name="discountAmount"
            dependencies={['discountType']}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  if (getFieldValue('discountType') === 'DISCOUNT_AMOUNT' && !value) {
                    return Promise.reject(new Error('Số tiền giảm là bắt buộc khi chọn loại Giảm giá'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
              placeholder="Nhập số tiền giảm (VND)"
            />
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
            {thumbnailUrl && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="isActive"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
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
    </>
  );
};

export default PromotionUpdate;

