import { Descriptions, Drawer, Image, Tag, Button, Space, Table, Badge } from "antd";
import React, { useState, useEffect } from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import type { ProductDTO } from "../../../services/product.service";
import VariantManager from "./variant-manager.product";
import { variantApi } from "../../../api/variant.api";
import type { ProductVariant } from "../../../types/variant.types";
import { VariantTypeLabels } from "../../../types/variant.types";

interface ProductDetailProps {
  isOpenDetailModal: boolean;
  setIsOpenDetailModal: (v: boolean) => void;
  dataDetailModal: ProductDTO | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  isOpenDetailModal,
  setIsOpenDetailModal,
  dataDetailModal,
}) => {
  const [isVariantManagerVisible, setIsVariantManagerVisible] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (isOpenDetailModal && dataDetailModal?.id) {
      loadVariants();
    }
  }, [isOpenDetailModal, dataDetailModal?.id]);

  const loadVariants = async () => {
    if (!dataDetailModal?.id) return;
    try {
      setLoadingVariants(true);
      const data = await variantApi.getVariantsByProductId(dataDetailModal.id, false);
      setVariants(data);
    } catch (error) {
      console.error("Không thể tải variants:", error);
    } finally {
      setLoadingVariants(false);
    }
  };

  return (
    <>
      <Drawer
        title="Chi tiết sản phẩm"
        open={isOpenDetailModal}
        onClose={() => {
          setIsOpenDetailModal(false);
        }}
        width="60%"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<AppstoreOutlined />}
              onClick={() => setIsVariantManagerVisible(true)}
            >
              Quản lý Variant
            </Button>
          </Space>
        }
      >
      {dataDetailModal && (
        <Descriptions title="Thông Tin Sản Phẩm" bordered column={2}>
          <Descriptions.Item label="ID">{dataDetailModal.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">
            {dataDetailModal.name}
          </Descriptions.Item>
          <Descriptions.Item label="SKU">
            {dataDetailModal.sku || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Thương hiệu">
            {dataDetailModal.brand || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Giá">
            {dataDetailModal.price
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(dataDetailModal.price)
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Giá giảm">
            {dataDetailModal.discountPrice
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(dataDetailModal.discountPrice)
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng">
            {dataDetailModal.stockQuantity ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Màu sắc">
            {dataDetailModal.color || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Kích thước">
            {dataDetailModal.size || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Trọng lượng">
            {dataDetailModal.weight || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Kích thước (DxRxC)">
            {dataDetailModal.dimensions || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục" span={2}>
            {dataDetailModal.categories && dataDetailModal.categories.length > 0
              ? dataDetailModal.categories.map((cat) => cat.name).join(", ")
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Nổi bật">
            <Tag color={dataDetailModal.isFeatured ? "orange" : "default"}>
              {dataDetailModal.isFeatured ? "Có" : "Không"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
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
          {dataDetailModal.specifications && (
            <Descriptions.Item label="Thông số kỹ thuật" span={2}>
              <div
                dangerouslySetInnerHTML={{
                  __html: dataDetailModal.specifications,
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
          {dataDetailModal.images && dataDetailModal.images.length > 0 && (
            <Descriptions.Item label="Hình ảnh" span={2}>
              <Image.PreviewGroup>
                {dataDetailModal.images.map((img) => (
                  <Image
                    key={img.id}
                    width={100}
                    src={img.imageUrl}
                    alt={`Image ${img.id}`}
                    style={{ marginRight: 8, borderRadius: "8px" }}
                  />
                ))}
              </Image.PreviewGroup>
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
          {variants.length > 0 && (
            <Descriptions.Item label="Variants" span={2}>
              <Table
                dataSource={variants}
                rowKey="id"
                loading={loadingVariants}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Loại",
                    dataIndex: "variantType",
                    key: "variantType",
                    render: (type: string) => (
                      <Tag color="blue">{VariantTypeLabels[type as keyof typeof VariantTypeLabels] || type}</Tag>
                    ),
                  },
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
                              width: 20,
                              height: 20,
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
                    render: (imageUrl: string | null, record: ProductVariant) =>
                      imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={record.variantValue}
                          width={50}
                          height={50}
                          style={{
                            objectFit: "cover",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                          preview={{
                            mask: "Xem ảnh",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            backgroundColor: "#f0f0f0",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "#999",
                          }}
                        >
                          N/A
                        </div>
                      ),
                  },
                  {
                    title: "Giá",
                    dataIndex: "price",
                    key: "price",
                    render: (price: number | null) =>
                      price
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(price)
                        : "-",
                  },
                  {
                    title: "Tồn kho",
                    dataIndex: "stockQuantity",
                    key: "stockQuantity",
                  },
                  {
                    title: "Trạng thái",
                    dataIndex: "isActive",
                    key: "isActive",
                    render: (active: boolean) => (
                      <Badge status={active ? "success" : "default"} text={active ? "Active" : "Inactive"} />
                    ),
                  },
                ]}
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </Drawer>

    {dataDetailModal && (
      <VariantManager
        productId={dataDetailModal.id}
        productName={dataDetailModal.name}
        visible={isVariantManagerVisible}
        onClose={() => {
          setIsVariantManagerVisible(false);
          loadVariants();
        }}
      />
    )}
    </>
  );
};

export default ProductDetail;
