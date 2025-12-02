import { Descriptions, Drawer, Image, Tag } from "antd";
import React from "react";
import type { CategoryDTO } from "../../../services/category.service";

interface CategoryDetailProps {
  isOpenDetailModal: boolean;
  setIsOpenDetailModal: (v: boolean) => void;
  dataDetailModal: CategoryDTO | null;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({
  isOpenDetailModal,
  setIsOpenDetailModal,
  dataDetailModal,
}) => {
  return (
    <Drawer
      title="Chi tiết danh mục"
      open={isOpenDetailModal}
      onClose={() => {
        setIsOpenDetailModal(false);
      }}
      width="60%"
    >
      {dataDetailModal && (
        <Descriptions title="Thông Tin Danh Mục" bordered column={2}>
          <Descriptions.Item label="ID">{dataDetailModal.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">
            {dataDetailModal.name}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            <Tag color={dataDetailModal.isActive ? "success" : "error"}>
              {dataDetailModal.isActive ? "Active" : "Inactive"}
            </Tag>
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
          <Descriptions.Item label="Tạo lúc">
            {dataDetailModal.createdAt
              ? new Date(dataDetailModal.createdAt).toLocaleString("vi-VN")
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {dataDetailModal.createdBy || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lúc">
            {dataDetailModal.updatedAt
              ? new Date(dataDetailModal.updatedAt).toLocaleString("vi-VN")
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Người cập nhật">
            {dataDetailModal.updatedBy || "N/A"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
};

export default CategoryDetail;
