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
import { userService } from "../../../services/user.service";
import type { UserDTO } from "../../../services/user.service";
import type { UserRole } from "@/types/user.types";
import { extractErrorMessage } from "../../../utils/error";
import { exportToExcel, type ExportColumn } from "../../../utils/exportExcel";
import UserDetail from "./detail.user";
import UserCreate from "./create-modal.user";
import UserUpdate from "./update.user";
import ImportUserModal from "./import-modal.user";

const UserAdminMain: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [api, contextHolder] = notification.useNotification();
  const requestIdRef = useRef<number>(0);

  const reload = async () => {
    console.log("🔄 [User Table] Reloading table...");
    await actionRef.current?.reload();
  };

  // Detail component
  const [isOpenDetailModal, setIsOpenDetailModal] = useState<boolean>(false);
  const [dataDetailModal, setDataDetailModal] = useState<UserDTO | null>(null);

  const handleOpenDetailModal = (record: UserDTO) => {
    setIsOpenDetailModal(true);
    setDataDetailModal(record);
  };

  // Create component
  const [isOpenCreateModal, setIsOpenCreateModal] = useState<boolean>(false);

  const handleOpenCreateModal = () => {
    setIsOpenCreateModal(true);
  };

  // Update component
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

      // Lấy tất cả users (không phân trang)
      const response = await userService.getAllUsers({
        page: 1,
        size: 10000, // Lấy tất cả
      });

      const users = response.result || [];

      // Định nghĩa columns cho export
      const columns: ExportColumn[] = [
        { header: "ID", key: "id", width: 10 },
        { header: "Username", key: "username", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 15 },
        { header: "Active", key: "isActive", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      // Format data for export
      const exportData = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive ? "Yes" : "No",
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleString("vi-VN")
          : "",
      }));

      await exportToExcel(
        exportData,
        columns,
        `users_export_${new Date().getTime()}.xlsx`
      );

      api.success({
        message: "Xuất Excel thành công",
        description: `Đã xuất ${users.length} người dùng`,
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
      await userService.deleteUser(id);
      api.success({
        message: "Xóa thành công",
        description: "User đã được xóa thành công",
        placement: "topRight",
      });
      reload();
    } catch (error: unknown) {
      const { message, errorCode, isAccessDenied } = extractErrorMessage(error);
      api.error({
        message: isAccessDenied ? "Không có quyền" : errorCode || "Lỗi",
        description: message,
        placement: "topRight",
        duration: isAccessDenied ? 6 : 5,
      });
    }
  };

  const columns: ProColumns<UserDTO>[] = [
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
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.avatarUrl ? (
          <Image
            src={record.avatarUrl}
            alt="Avatar"
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
      title: "Username",
      dataIndex: "username",
      key: "username",
      ellipsis: true,
      copyable: true,
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      copyable: true,
      sorter: true,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      valueType: "select",
      valueEnum: {
        ADMIN: { text: "ADMIN" },
        USER: { text: "USER" },
      },
      render: (_, record) => (
        <Tag color={record.role === "ADMIN" ? "red" : "blue"}>
          {record.role}
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
          <Popconfirm
            title="Xóa user"
            description="Bạn có chắc chắn muốn xóa user này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <DeleteOutlined
              style={{ cursor: "pointer", color: "#ff5733", fontSize: "16px" }}
            />
          </Popconfirm>
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
      <h1 style={{ padding: "20px" }}>Quản lý người dùng</h1>
      <UserDetail
        isOpenDetailModal={isOpenDetailModal}
        setIsOpenDetailModal={setIsOpenDetailModal}
        dataDetailModal={dataDetailModal}
      />

      <UserCreate
        isOpenCreateModal={isOpenCreateModal}
        setIsOpenCreateModal={setIsOpenCreateModal}
        reload={reload}
      />

      <UserUpdate
        isOpenUpdateModal={isOpenUpdateModal}
        setIsOpenUpdateModal={setIsOpenUpdateModal}
        reload={reload}
        dataDetailModal={dataDetailModal}
      />

      <ImportUserModal
        isOpenImportModal={isOpenImportModal}
        setIsOpenImportModal={setIsOpenImportModal}
        reload={reload}
      />

      <div style={{ padding: "0 20px 20px 20px" }}>
        <ProTable<UserDTO>
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
                username?: string;
                email?: string;
                role?: UserRole;
                isActive?: boolean;
              } = {
                page: params.current || 1,
                size: params.pageSize || 10,
                sort: sortField,
                direction: sortDirection,
              };

              // Log để debug
              console.log(
                `🔍 [User Table #${currentRequestId}] Request params:`,
                {
                  params,
                  sort,
                  queryParams: { ...queryParams },
                }
              );

              if (params.id) {
                queryParams.id = Number(params.id);
              }
              if (params.username) {
                queryParams.username = params.username;
              }
              if (params.email) {
                queryParams.email = params.email;
              }
              if (params.role) {
                queryParams.role = params.role as UserRole;
              }
              if (params.isActive !== undefined) {
                queryParams.isActive = params.isActive;
              }

              console.log(
                `📤 [User Table #${currentRequestId}] Sending request:`,
                queryParams
              );
              const startTime = Date.now();

              const response = await userService.getAllUsers(queryParams);

              // Kiểm tra nếu request này đã bị override bởi request mới hơn
              if (currentRequestId !== requestIdRef.current) {
                console.log(
                  `⚠️ [User Table #${currentRequestId}] Request bị hủy, có request mới hơn`
                );
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }

              const endTime = Date.now();
              console.log(`📥 [User Table #${currentRequestId}] Response:`, {
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
              const { message, errorCode } = extractErrorMessage(error);
              api.error({
                message: errorCode || "Lỗi",
                description: message,
                placement: "topRight",
                duration: 5,
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
            showTotal: (total) => `Tổng ${total} người dùng`,
          }}
          dateFormatter="string"
          headerTitle="Danh sách người dùng"
          toolBarRender={() => [
            <Button
              key="button"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              type="primary"
            >
              Thêm user
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

export default UserAdminMain;
