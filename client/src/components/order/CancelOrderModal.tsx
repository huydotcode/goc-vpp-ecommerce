import React, { useState } from "react";
import { Modal, Typography, Space, Tag, Input } from "antd";

const { Text } = Typography;

interface CancelOrderModalProps {
  open: boolean;
  orderCode?: string | null;
  loading: boolean;
  onSubmit: (reason?: string) => void;
  onCancel: () => void;
}

const QUICK_REASONS: string[] = [
  "Đổi ý, không muốn mua nữa",
  "Đặt nhầm sản phẩm",
  "Tìm thấy sản phẩm rẻ hơn",
  "Thông tin địa chỉ sai",
  "Không đủ tiền thanh toán",
  "Sản phẩm không còn phù hợp",
];

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  open,
  orderCode,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [reason, setReason] = useState("");

  const handleOk = () => {
    const trimmed = reason.trim();
    onSubmit(trimmed || undefined);
  };

  const handleClose = () => {
    setReason("");
    onCancel();
  };

  return (
    <Modal
      title="Hủy đơn hàng"
      open={open}
      onOk={handleOk}
      onCancel={handleClose}
      confirmLoading={loading}
      okText="Xác nhận hủy"
      cancelText="Không"
      okButtonProps={{ danger: true }}
    >
      <div className="space-y-3">
        <Text>
          Bạn có chắc chắn muốn hủy đơn hàng{" "}
          <strong>#{orderCode ?? ""}</strong>?
        </Text>
        <div>
          <Text strong>Lý do hủy (tùy chọn):</Text>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <Space size={[8, 8]} wrap>
              {QUICK_REASONS.map((r) => (
                <Tag
                  key={r}
                  style={{ cursor: "pointer" }}
                  color={reason === r ? "blue" : "default"}
                  onClick={() => setReason(r)}
                >
                  {r}
                </Tag>
              ))}
            </Space>
          </div>
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setReason(e.target.value)
            }
            placeholder="Hoặc nhập lý do hủy đơn hàng của bạn..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;


