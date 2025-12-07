import React, { useRef, useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Space, Tag, notification, Popconfirm, Image } from "antd";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { productService } from "../../../services/product.service";
import type { ProductDTO } from "../../../services/product.service";
import { extractErrorMessage } from "../../../utils/error";
import { exportToExcel, type ExportColumn } from "../../../utils/exportExcel";
import { useAuth } from "../../../contexts/AuthContext";
import Barcode from "../../common/Barcode";
import ProductDetail from "./detail.product";
import ProductCreate from "./create-modal.product";
import ProductUpdate from "./update.product";
import ImportProductModal from "./import-modal.product";

const ProductAdminMain: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [api, contextHolder] = notification.useNotification();
  const requestIdRef = useRef<number>(0);
  const { userRole } = useAuth();

  const reload = async () => {
    console.log("🔄 [Product Table] Reloading table...");
    await actionRef.current?.reload();
  };

  const [isOpenDetailModal, setIsOpenDetailModal] = useState<boolean>(false);
  const [dataDetailModal, setDataDetailModal] = useState<ProductDTO | null>(
    null
  );

  const handleOpenDetailModal = (record: ProductDTO) => {
    setIsOpenDetailModal(true);
    setDataDetailModal(record);
  };

  const [isOpenCreateModal, setIsOpenCreateModal] = useState<boolean>(false);

  const handleOpenCreateModal = () => {
    setIsOpenCreateModal(true);
  };

  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState<boolean>(false);

  const handleOpenUpdateModal = () => {
    setIsOpenUpdateModal(true);
  };

  // Import component
  const [isOpenImportModal, setIsOpenImportModal] = useState<boolean>(false);

  const handleOpenImportModal = () => {
    setIsOpenImportModal(true);
  };

  // Export function
  const handleExport = async () => {
    try {
      api.info({
        message: "Đang xuất dữ liệu...",
        description: "Vui lòng đợi trong giây lát",
        placement: "topRight",
      });

      // Lấy tất cả products (không phân trang)
      const response = await productService.getAllProducts({
        page: 1,
        size: 10000, // Lấy tất cả
      });

      const products = response.result || [];

      // Định nghĩa columns cho export
      const columns: ExportColumn[] = [
        { header: "ID", key: "id", width: 10 },
        { header: "Tên", key: "name", width: 30 },
        { header: "SKU", key: "sku", width: 20 },
        { header: "Giá", key: "price", width: 15 },
        { header: "Giá giảm", key: "discountPrice", width: 15 },
        { header: "Số lượng", key: "stockQuantity", width: 15 },
        { header: "Thương hiệu", key: "brand", width: 20 },
        { header: "Active", key: "isActive", width: 15 },
        { header: "Featured", key: "isFeatured", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      // Format data for export
      const exportData = products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        price: product.price ? product.price.toLocaleString("vi-VN") : "",
        discountPrice: product.discountPrice
          ? product.discountPrice.toLocaleString("vi-VN")
          : "",
        stockQuantity: product.stockQuantity || 0,
        brand: product.brand || "",
        isActive: product.isActive ? "Yes" : "No",
        isFeatured: product.isFeatured ? "Yes" : "No",
        createdAt: product.createdAt
          ? new Date(product.createdAt).toLocaleString("vi-VN")
          : "",
      }));

      await exportToExcel(
        exportData,
        columns,
        `products_export_${new Date().getTime()}.xlsx`
      );

      api.success({
        message: "Xuất Excel thành công",
        description: `Đã xuất ${products.length} sản phẩm`,
        placement: "topRight",
      });
    } catch (error) {
      const { message } = extractErrorMessage(error);
      api.error({
        message: "Lỗi xuất Excel",
        description: message,
        placement: "topRight",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      api.success({
        message: "Xóa thành công",
        description: "Sản phẩm đã được xóa thành công",
        placement: "topRight",
      });
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

  const columns: ProColumns<ProductDTO>[] = [
    {
      dataIndex: "index",
      valueType: "indexBorder",
      width: 48,
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      copyable: true,
      sorter: true,
      valueType: "digit",
      render: (_, record) => (
        <a
          onClick={() => {
            handleOpenDetailModal(record);
          }}
        >
          {record.id}
        </a>
      ),
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnailUrl",
      key: "thumbnailUrl",
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.thumbnailUrl ? (
          <Image
            src={record.thumbnailUrl}
            alt="Thumbnail"
            width={50}
            height={50}
            style={{
              objectFit: "cover",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            N/A
          </div>
        ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      copyable: true,
      sorter: true,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      ellipsis: true,
      copyable: true,
      sorter: true,
      render: (_, record) =>
        record.sku ? (
          <Barcode
            value={record.sku}
            width={1.5}
            height={40}
            displayValue={true}
          />
        ) : (
          <span>N/A</span>
        ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      hideInSearch: true,
      sorter: true,
      render: (_, record) =>
        record.price
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(record.price)
          : "N/A",
    },
    {
      title: "Giá giảm",
      dataIndex: "discountPrice",
      key: "discountPrice",
      hideInSearch: true,
      sorter: true,
      render: (_, record) =>
        record.discountPrice
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(record.discountPrice)
          : "N/A",
    },
    {
      title: "Số lượng",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      hideInSearch: true,
      sorter: true,
      render: (_, record) => record.stockQuantity ?? "N/A",
    },
    {
      title: "Thương hiệu",
      dataIndex: "brand",
      key: "brand",
      ellipsis: true,
      sorter: true,
    },
    {
      title: "Danh mục",
      dataIndex: "categories",
      key: "categories",
      hideInSearch: true,
      render: (_, record) =>
        record.categories && record.categories.length > 0
          ? record.categories.map((cat) => cat.name).join(", ")
          : "N/A",
    },
    {
      title: "Variants",
      dataIndex: "variants",
      key: "variants",
      hideInSearch: true,
      render: (_, record) => {
        const variantCount = record.variants?.length || 0;
        return variantCount > 0 ? (
          <Tag color="blue">{variantCount} variant{variantCount > 1 ? "s" : ""}</Tag>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      key: "isFeatured",
      valueType: "select",
      valueEnum: {
        true: { text: "Có" },
        false: { text: "Không" },
      },
      render: (_, record) => (
        <Tag color={record.isFeatured ? "orange" : "default"}>
          {record.isFeatured ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      valueType: "select",
      valueEnum: {
        true: { text: "Active" },
        false: { text: "Inactive" },
      },
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      valueType: "date",
      hideInSearch: true,
      sorter: true,
      render: (_, record) =>
        record.createdAt
          ? new Date(record.createdAt).toLocaleDateString("vi-VN")
          : "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      fixed: "right",
      hideInSearch: true,
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            onClick={() => {
              handleOpenUpdateModal();
              setDataDetailModal(record);
            }}
            style={{ cursor: "pointer", color: "#ff5733", fontSize: "16px" }}
          />
          {userRole !== "EMPLOYEE" && (
            <Popconfirm
              title="Xóa sản phẩm"
              description="Bạn có chắc chắn muốn xóa sản phẩm này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <DeleteOutlined
                style={{
                  cursor: "pointer",
                  color: "#ff5733",
                  fontSize: "16px",
                }}
              />
            </Popconfirm>
          )}
          <MoreOutlined
            style={{ cursor: "pointer", color: "#ff5733", fontSize: "16px" }}
            onClick={() => handleOpenDetailModal(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <h1 style={{ padding: "20px" }}>Quản lý sản phẩm</h1>
      <ProductDetail
        isOpenDetailModal={isOpenDetailModal}
        setIsOpenDetailModal={setIsOpenDetailModal}
        dataDetailModal={dataDetailModal}
      />

      <ProductCreate
        isOpenCreateModal={isOpenCreateModal}
        setIsOpenCreateModal={setIsOpenCreateModal}
        reload={reload}
      />

      <ProductUpdate
        isOpenUpdateModal={isOpenUpdateModal}
        setIsOpenUpdateModal={setIsOpenUpdateModal}
        reload={reload}
        dataDetailModal={dataDetailModal}
      />

      <ImportProductModal
        isOpenImportModal={isOpenImportModal}
        setIsOpenImportModal={setIsOpenImportModal}
        reload={reload}
      />

      <div style={{ padding: "0 20px 20px 20px" }}>
        <ProTable<ProductDTO>
          actionRef={actionRef}
          columns={columns}
          request={async (params, sort) => {
            const currentRequestId = ++requestIdRef.current;

            try {
              // Xử lý sort từ ProTable
              let sortField = "id";
              let sortDirection: "asc" | "desc" = "asc";

              if (sort && Object.keys(sort).length > 0) {
                const sortKey = Object.keys(sort)[0];
                const sortValue = sort[sortKey];
                sortField = sortKey;
                sortDirection = sortValue === "ascend" ? "asc" : "desc";
              }

              const queryParams: {
                page?: number;
                size?: number;
                sort?: string;
                direction?: "asc" | "desc";
                id?: number;
                name?: string;
                sku?: string;
                brand?: string;
                categoryId?: number;
                isFeatured?: boolean;
                isActive?: boolean;
                search?: string;
              } = {
                page: params.current || 1,
                size: params.pageSize || 10,
                sort: sortField,
                direction: sortDirection,
              };

              // Log để debug
              console.log(
                `🔍 [Product Table #${currentRequestId}] Request params:`,
                {
                  params,
                  sort,
                  queryParams: { ...queryParams },
                }
              );

              if (params.id) {
                queryParams.id = Number(params.id);
              }
              if (params.name) {
                queryParams.name = params.name;
              }
              if (params.sku) {
                queryParams.sku = params.sku;
              }
              if (params.brand) {
                queryParams.brand = params.brand;
              }
              if (params.categoryId) {
                queryParams.categoryId = params.categoryId;
              }
              if (params.isFeatured !== undefined) {
                queryParams.isFeatured = params.isFeatured;
              }
              if (params.isActive !== undefined) {
                queryParams.isActive = params.isActive;
              }

              console.log(
                `📤 [Product Table #${currentRequestId}] Sending request:`,
                queryParams
              );
              const startTime = Date.now();

              const response = await productService.getAllProducts(queryParams);

              // Kiểm tra nếu request này đã bị override bởi request mới hơn
              if (currentRequestId !== requestIdRef.current) {
                console.log(
                  `⚠️ [Product Table #${currentRequestId}] Request bị hủy, có request mới hơn`
                );
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }

              const endTime = Date.now();
              console.log(`📥 [Product Table #${currentRequestId}] Response:`, {
                duration: `${endTime - startTime}ms`,
                total: response?.metadata?.totalElements || 0,
                dataCount: response?.result?.length || 0,
              });
              if (response && response.result && response.metadata) {
                return {
                  data: response.result,
                  success: true,
                  total: response.metadata.totalElements,
                };
              } else {
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }
            } catch (error: unknown) {
              const { message, errorCode, isAccessDenied } =
                extractErrorMessage(error);
              api.error({
                message: isAccessDenied ? "Không có quyền" : errorCode || "Lỗi",
                description: message,
                placement: "topRight",
                duration: isAccessDenied ? 6 : 5,
              });
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          rowKey="id"
          search={{
            labelWidth: "auto",
            optionRender: (_searchConfig, _formProps, dom) => [
              ...dom.reverse(),
            ],
          }}
          debounceTime={300}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
          dateFormatter="string"
          headerTitle="Danh sách sản phẩm"
          toolBarRender={() => [
            <Button
              key="button"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              type="primary"
            >
              Thêm sản phẩm
            </Button>,
            <Button
              key="import"
              icon={<ImportOutlined />}
              onClick={handleOpenImportModal}
              type="primary"
            >
              Import Excel
            </Button>,
            <Button
              key="export"
              icon={<ExportOutlined />}
              onClick={handleExport}
              type="default"
            >
              Export Excel
            </Button>,
          ]}
          scroll={{ x: "max-content" }}
          bordered
          cardBordered
        />
      </div>
    </>
  );
};

export default ProductAdminMain;
