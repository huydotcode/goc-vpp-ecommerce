import React, { useState } from 'react';
import {
  Modal,
  notification,
  Space,
  Table,
  Upload,
} from 'antd';
import type { TableProps } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { InboxOutlined } from '@ant-design/icons';
import Exceljs from 'exceljs';
import { productService } from '../../../services/product.service';
import type { CreateProductRequest } from '../../../services/product.service';
import { extractErrorMessage } from '../../../utils/errorHandler';

const { Dragger } = Upload;

interface ImportProductModalProps {
  isOpenImportModal: boolean;
  setIsOpenImportModal: (v: boolean) => void;
  reload: () => void;
}

const ImportProductModal: React.FC<ImportProductModalProps> = ({
  isOpenImportModal,
  setIsOpenImportModal,
  reload,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const [dataImport, setDataImport] = useState<CreateProductRequest[]>([]);

  // Table columns
  const columns: TableProps<CreateProductRequest>['columns'] = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'N/A',
    },
    {
      title: 'Giá giảm',
      dataIndex: 'discountPrice',
      key: 'discountPrice',
      render: (price: number) => price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'N/A',
    },
    {
      title: 'Số lượng',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const propsUpload: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept:
      '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
    customRequest: ({ onSuccess }) => {
      if (onSuccess) {
        onSuccess('ok');
      }
    },
    async onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }

      if (status === 'done') {
        if (info.fileList && info.fileList.length > 0) {
          // Lấy file
          const file = info.fileList[0].originFileObj!;

          try {
            const jsonData: CreateProductRequest[] = [];
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv');

            if (isCSV) {
              // Parse CSV file
              const text = await file.text();
              const lines = text.split('\n').filter(line => line.trim());
              
              if (lines.length < 2) {
                throw new Error('File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu');
              }

              // Parse header
              const headers = lines[0].split(',').map(h => h.trim());
              
              // Parse data rows
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const obj: Record<string, string> = {};
                
                headers.forEach((header, index) => {
                  obj[header] = values[index] || '';
                });

                // Map CSV columns to CreateProductRequest
                const isActiveValue = obj.isActive || obj['Trạng thái'];
                const isActive = isActiveValue === 'true' || isActiveValue === true || isActiveValue === undefined || isActiveValue === '';
                const isFeaturedValue = obj.isFeatured || obj['Nổi bật'];
                const isFeatured = isFeaturedValue === 'true' || isFeaturedValue === true;
                
                const productData: CreateProductRequest = {
                  name: String(obj.name || obj['Tên'] || obj['Name'] || ''),
                  description: String(obj.description || obj['Mô tả'] || obj['Description'] || ''),
                  price: obj.price ? Number(obj.price) : obj['Giá'] ? Number(obj['Giá']) : obj['Price'] ? Number(obj['Price']) : undefined,
                  discountPrice: obj.discountPrice ? Number(obj.discountPrice) : obj['Giá giảm'] ? Number(obj['Giá giảm']) : obj['Discount Price'] ? Number(obj['Discount Price']) : undefined,
                  stockQuantity: obj.stockQuantity ? Number(obj.stockQuantity) : obj['Số lượng'] ? Number(obj['Số lượng']) : obj['Stock Quantity'] ? Number(obj['Stock Quantity']) : 0,
                  sku: String(obj.sku || obj['SKU'] || obj['Mã SKU'] || ''),
                  brand: String(obj.brand || obj['Thương hiệu'] || obj['Brand'] || ''),
                  color: String(obj.color || obj['Màu sắc'] || obj['Color'] || ''),
                  size: String(obj.size || obj['Kích thước'] || obj['Size'] || ''),
                  weight: String(obj.weight || obj['Trọng lượng'] || obj['Weight'] || ''),
                  dimensions: String(obj.dimensions || obj['Kích thước'] || obj['Dimensions'] || ''),
                  specifications: String(obj.specifications || obj['Thông số'] || obj['Specifications'] || ''),
                  isActive,
                  isFeatured,
                };

                // Parse categoryIds if exists
                if (obj.categoryIds || obj['Danh mục'] || obj['Category IDs']) {
                  const categoryIdsStr = obj.categoryIds || obj['Danh mục'] || obj['Category IDs'];
                  if (typeof categoryIdsStr === 'string') {
                    productData.categoryIds = categoryIdsStr
                      .split(',')
                      .map((id: string) => Number(id.trim()))
                      .filter((id: number) => !isNaN(id));
                  } else if (Array.isArray(categoryIdsStr)) {
                    productData.categoryIds = categoryIdsStr.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
                  }
                }

                if (productData.name) {
                  jsonData.push(productData);
                }
              }
            } else {
              // Parse Excel file
              const workBook = new Exceljs.Workbook();
              const arrBuffer = await file.arrayBuffer();
              await workBook.xlsx.load(arrBuffer);

              workBook.worksheets.forEach(function (sheet) {
                const firstRow = sheet.getRow(1);
                if (!firstRow.cellCount) return;

                const keys = firstRow.values as (string | number)[];

                sheet.eachRow((row, rowNumber) => {
                  if (rowNumber === 1) return;
                  const values = row.values as (string | number)[];
                  const obj: Record<string, string | number> = {};
                  for (let i = 0; i < keys.length; i++) {
                    obj[keys[i]] = values[i] || '';
                  }

                  // Map Excel columns to CreateProductRequest
                  const name = String(obj.name || obj['Tên'] || obj['Name'] || '');
                  const description = String(obj.description || obj['Mô tả'] || obj['Description'] || '');
                  const price = obj.price ? Number(obj.price) : obj['Giá'] ? Number(obj['Giá']) : obj['Price'] ? Number(obj['Price']) : undefined;
                  const discountPrice = obj.discountPrice ? Number(obj.discountPrice) : obj['Giá giảm'] ? Number(obj['Giá giảm']) : obj['Discount Price'] ? Number(obj['Discount Price']) : undefined;
                  const stockQuantity = obj.stockQuantity ? Number(obj.stockQuantity) : obj['Số lượng'] ? Number(obj['Số lượng']) : obj['Stock Quantity'] ? Number(obj['Stock Quantity']) : 0;
                  const sku = String(obj.sku || obj['SKU'] || obj['Mã SKU'] || '');
                  const brand = String(obj.brand || obj['Thương hiệu'] || obj['Brand'] || '');
                  const color = String(obj.color || obj['Màu sắc'] || obj['Color'] || '');
                  const size = String(obj.size || obj['Kích thước'] || obj['Size'] || '');
                  const weight = String(obj.weight || obj['Trọng lượng'] || obj['Weight'] || '');
                  const dimensions = String(obj.dimensions || obj['Kích thước'] || obj['Dimensions'] || '');
                  const specifications = String(obj.specifications || obj['Thông số'] || obj['Specifications'] || '');
                  const isActive = obj.isActive !== undefined ? Boolean(obj.isActive) : obj['Trạng thái'] !== undefined ? Boolean(obj['Trạng thái']) : true;
                  const isFeatured = obj.isFeatured !== undefined ? Boolean(obj.isFeatured) : obj['Nổi bật'] !== undefined ? Boolean(obj['Nổi bật']) : false;
                  
                  const productData: CreateProductRequest = {
                    name,
                    description,
                    price,
                    discountPrice,
                    stockQuantity,
                    sku,
                    brand,
                    color,
                    size,
                    weight,
                    dimensions,
                    specifications,
                    isActive,
                    isFeatured,
                  };

                  // Parse categoryIds if exists
                  if (obj.categoryIds || obj['Danh mục'] || obj['Category IDs']) {
                    const categoryIdsStr = obj.categoryIds || obj['Danh mục'] || obj['Category IDs'];
                    if (typeof categoryIdsStr === 'string') {
                      productData.categoryIds = categoryIdsStr
                        .split(',')
                        .map((id: string) => Number(id.trim()))
                        .filter((id: number) => !isNaN(id));
                    } else if (Array.isArray(categoryIdsStr)) {
                      productData.categoryIds = categoryIdsStr.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
                    }
                  }

                  if (productData.name) {
                    jsonData.push(productData);
                  }
                });
              });
            }

            setDataImport(jsonData);
            api.success({
              message: 'Thành công',
              description: `${info.file.name} đã được tải lên thành công.`,
            });
          } catch (error) {
            const { message } = extractErrorMessage(error);
            api.error({
              message: 'Lỗi',
              description: `Không thể đọc file: ${message}`,
            });
          }
        }
      } else if (status === 'error') {
        api.error({
          message: 'Thất bại',
          description: `${info.file.name} tải lên thất bại.`,
        });
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const handleClose = () => {
    setIsOpenImportModal(false);
    setDataImport([]);
  };

  const handleSubmit = async () => {
    const length = dataImport.length;
    let successCount = 0;
    let failCount = 0;

    if (length === 0) {
      api.warning({
        message: 'Thất bại',
        description: 'Dữ liệu trống.',
      });
      return;
    }

    try {
      await Promise.all(
        dataImport.map(async (productData) => {
          try {
            await productService.createProduct(productData);
            successCount++;
          } catch (error) {
            failCount++;
            console.error('Error creating product:', error);
          }
        })
      );

      api.info({
        message: 'Thông báo',
        description: `Đã tải lên ${successCount} sản phẩm. Thất bại ${failCount}`,
      });

      setDataImport([]);
      setIsOpenImportModal(false);
      reload();
    } catch (error) {
      const { message } = extractErrorMessage(error);
      api.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra: ${message}`,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Import sản phẩm"
        open={isOpenImportModal}
        onOk={handleSubmit}
        onCancel={handleClose}
        width="80%"
        okText="Import"
        cancelText="Hủy"
      >
        <Dragger {...propsUpload}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Nhấp hoặc kéo tệp vào đây để tải lên
          </p>
          <p className="ant-upload-hint">
            Hỗ trợ tải lên một tệp. Chỉ chấp nhận .csv, .xls, .xlsx hoặc &nbsp;
            <a
              href="/templates/sample_products.csv"
              download="sample_products.csv"
              onClick={(e) => e.stopPropagation()}
            >
              Tải xuống tệp mẫu
            </a>
          </p>
        </Dragger>
        <Space style={{ marginTop: 16 }} />
        {dataImport.length > 0 && (
          <Table
            scroll={{ x: 'max-content' }}
            dataSource={dataImport.map((item, index) => ({
              ...item,
              key: index,
            }))}
            columns={columns}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Modal>
    </>
  );
};

export default ImportProductModal;

