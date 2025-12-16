import React from "react";
import { Descriptions, Drawer, Tag, Image } from "antd";
import type { PromotionDTO } from "../../../services/promotion.service";
import PromotionCountdown from "@/components/promotion/PromotionCountdown";

interface PromotionDetailProps {
  isOpenDetailModal: boolean;
  setIsOpenDetailModal: (v: boolean) => void;
  dataDetailModal: PromotionDTO | null;
  setDataDetailModal: (v: PromotionDTO | null) => void;
}

const PromotionDetail: React.FC<PromotionDetailProps> = ({
  isOpenDetailModal,
  setIsOpenDetailModal,
  dataDetailModal,
}) => {
  return (
    <Drawer
      title="Chi tiết khuyến mãi"
      open={isOpenDetailModal}
      onClose={() => {
        setIsOpenDetailModal(false);
      }}
      width="60%"
    >
      {dataDetailModal && (
        <Descriptions title="Thông Tin Khuyến Mãi" bordered column={2}>
          <Descriptions.Item label="ID">{dataDetailModal.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">
            {dataDetailModal.name}
          </Descriptions.Item>
          <Descriptions.Item label="Loại giảm giá">
            <Tag
              color={
                dataDetailModal.discountType === "DISCOUNT_AMOUNT"
                  ? "blue"
                  : "orange"
              }
            >
              {dataDetailModal.discountType === "DISCOUNT_AMOUNT"
                ? "Giảm giá"
                : "Quà tặng"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền giảm">
            {dataDetailModal.discountAmount
              ? new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(dataDetailModal.discountAmount)
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={dataDetailModal.isActive ? "green" : "red"}>
              {dataDetailModal.isActive ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian" span={2}>
            <PromotionCountdown
              startDate={dataDetailModal.startDate}
              endDate={dataDetailModal.endDate}
              showStatus={true}
              showCountdown={true}
            />
          </Descriptions.Item>
          {dataDetailModal.description && (
            <Descriptions.Item label="Mô tả" span={2}>
              <div
                dangerouslySetInnerHTML={{
                  __html: dataDetailModal.description,
                }}
              />
            </Descriptions.Item>
          )}
          {dataDetailModal.thumbnailUrl && (
            <Descriptions.Item label="Thumbnail" span={2}>
              <Image
                width={200}
                src={dataDetailModal.thumbnailUrl}
                alt="Thumbnail"
                style={{ borderRadius: "8px" }}
              />
            </Descriptions.Item>
          )}
          {dataDetailModal.conditions &&
            dataDetailModal.conditions.length > 0 && (
              <Descriptions.Item label="Điều kiện" span={2}>
                {dataDetailModal.conditions.map((condition, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      backgroundColor: "#f5f5f5",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Nhóm {idx + 1}:{" "}
                      {condition.operator === "ALL" ? "Tất cả" : "Bất kỳ"}
                    </div>
                    {condition.details.map((detail, detailIdx) => (
                      <div
                        key={detailIdx}
                        style={{ marginLeft: 16, marginTop: 4 }}
                      >
                        -{" "}
                        {detail.productName ||
                          `Sản phẩm ID: ${detail.productId}`}{" "}
                        x {detail.requiredQuantity}
                      </div>
                    ))}
                  </div>
                ))}
              </Descriptions.Item>
            )}
          {dataDetailModal.giftItems &&
            dataDetailModal.giftItems.length > 0 && (
              <Descriptions.Item label="Quà tặng" span={2}>
                {dataDetailModal.giftItems.map((gift, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      backgroundColor: "#fff7e6",
                      borderRadius: "8px",
                    }}
                  >
                    {gift.productName || `Sản phẩm ID: ${gift.productId}`} x{" "}
                    {gift.quantity}
                  </div>
                ))}
              </Descriptions.Item>
            )}
        </Descriptions>
      )}
    </Drawer>
  );
};

export default PromotionDetail;
