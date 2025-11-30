import React from 'react';
import { Descriptions, Drawer, Tag, Image } from 'antd';
import type { ProductDTO } from '../../../services/product.service';

interface ProductDetailProps {
  isOpenDetailModal: boolean;
  setIsOpenDetailModal: (v: boolean) => void;
  dataDetailModal: ProductDTO | null;
  setDataDetailModal: (v: ProductDTO | null) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  isOpenDetailModal,
  setIsOpenDetailModal,
  dataDetailModal,
  setDataDetailModal,
}) => {
  return (
    <Drawer
      title="Chi tiết sản phẩm"
      open={isOpenDetailModal}
      onClose={() => {
        setIsOpenDetailModal(false);
      }}
      width="60%"
    >
      {dataDetailModal && (
        <Descriptions title="Thông Tin Sản Phẩm" bordered column={2}>
          <Descriptions.Item label="ID">{dataDetailModal.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">{dataDetailModal.name}</Descriptions.Item>
          <Descriptions.Item label="SKU">{dataDetailModal.sku || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Thương hiệu">{dataDetailModal.brand || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Giá">
            {dataDetailModal.price
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dataDetailModal.price)
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Giá giảm">
            {dataDetailModal.discountPrice
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dataDetailModal.discountPrice)
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng">{dataDetailModal.stockQuantity ?? 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Màu sắc">{dataDetailModal.color || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Kích thước">{dataDetailModal.size || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Trọng lượng">{dataDetailModal.weight || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Kích thước (DxRxC)">{dataDetailModal.dimensions || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Danh mục" span={2}>
            {dataDetailModal.categories && dataDetailModal.categories.length > 0
              ? dataDetailModal.categories.map((cat) => cat.name).join(', ')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Nổi bật">
            <Tag color={dataDetailModal.isFeatured ? 'orange' : 'default'}>
              {dataDetailModal.isFeatured ? 'Có' : 'Không'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={dataDetailModal.isActive ? 'green' : 'red'}>
              {dataDetailModal.isActive ? 'Active' : 'Inactive'}
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
                style={{ borderRadius: '8px' }}
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
                    style={{ marginRight: 8, borderRadius: '8px' }}
                  />
                ))}
              </Image.PreviewGroup>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Tạo lúc">
            {dataDetailModal.createdAt
              ? new Date(dataDetailModal.createdAt).toLocaleString('vi-VN')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {dataDetailModal.createdBy || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lúc">
            {dataDetailModal.updatedAt
              ? new Date(dataDetailModal.updatedAt).toLocaleString('vi-VN')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Người cập nhật">
            {dataDetailModal.updatedBy || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
};

export default ProductDetail;

