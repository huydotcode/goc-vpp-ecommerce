import React, { useMemo } from "react";
import { Modal, Form, Rate, Input, Card, Typography, Select } from "antd";

const { Text } = Typography;

export interface ReviewFormValues {
  rating: number;
  content: string;
}

export interface ReviewableItem {
  productId: number;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
}

interface ReviewModalProps {
  open: boolean;
  loading: boolean;
  items: ReviewableItem[];
  reviewingProductId: number | null;
  onChangeProduct: (productId: number) => void;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  loading,
  items,
  reviewingProductId,
  onChangeProduct,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<ReviewFormValues>();

  const reviewableItems = items;

  const activeProductId =
    reviewingProductId ?? reviewableItems[0]?.productId ?? null;

  const reviewingProduct = useMemo(() => {
    if (!activeProductId) return null;
    return (
      reviewableItems.find((item) => item.productId === activeProductId) || null
    );
  }, [activeProductId, reviewableItems]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Text strong style={{ fontSize: 16 }}>
            Đánh giá sản phẩm
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hãy chia sẻ trải nghiệm thực tế của bạn để giúp người mua khác.
          </Text>
        </div>
      }
      centered
      open={open}
      onOk={handleOk}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      confirmLoading={loading}
      okText="Gửi đánh giá"
      cancelText="Hủy"
      width={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviewableItems.length > 1 && (
          <div>
            <Text strong className="text-sm">
              Chọn sản phẩm cần đánh giá
            </Text>
            <Select
              style={{ marginTop: 4, width: "100%" }}
              value={activeProductId ?? undefined}
              onChange={(value) => onChangeProduct(value)}
              options={reviewableItems.map((item) => ({
                value: item.productId,
                label: item.productName,
              }))}
            />
          </div>
        )}

        {reviewingProduct && (
          <Card
            size="small"
            className="bg-gray-50 border border-gray-200 rounded"
          >
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                {reviewingProduct.imageUrl ? (
                  <img
                    src={reviewingProduct.imageUrl}
                    alt={reviewingProduct.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">
                  {reviewingProduct.productName}
                </div>
                <div className="text-xs text-gray-500">
                  Số lượng: x{reviewingProduct.quantity}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Form<ReviewFormValues>
          form={form}
          layout="vertical"
          initialValues={{ rating: 5 }}
        >
          <Form.Item
            name="rating"
            label="Mức độ hài lòng"
            rules={[{ required: true, message: "Vui lòng chọn số sao" }]}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Rate style={{ fontSize: 20 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                1 sao: Rất tệ • 5 sao: Rất hài lòng
              </Text>
            </div>
          </Form.Item>

          <Form.Item name="content" label="Nhận xét chi tiết">
            <Input.TextArea
              rows={4}
              placeholder="Sản phẩm có đúng mô tả không, chất lượng, đóng gói, giao hàng...?"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ReviewModal;
