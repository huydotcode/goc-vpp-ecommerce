import React, { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Table,
  Space,
  Tag,
  notification,
  Popconfirm,
  Image,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { userService } from "../../../services/user.service";
import type { UserDTO } from "../../../services/user.service";
import { extractErrorMessage } from "../../../utils/error";
import UserDetail from "./detail.user";
import UserCreate from "./create-modal.user";
import UserUpdate from "./update.user";

const UserAdminMain: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const [dataUserTable, setDataUserTable] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

  const reload = async () => {
    await fetchUsers(pagination.current, pagination.pageSize);
  };

  const fetchUsers = async (page: number, pageSize: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      api.warning({
        message: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để tiếp tục",
      });
      return;
    }

    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sort: "id",
        direction: "desc" as const,
      };

      const response = await userService.getAllUsers(params);
      if (response && response.result && response.metadata) {
        setDataUserTable(response.result);
        setPagination({
          current: response.metadata.page,
          pageSize: response.metadata.size,
          total: response.metadata.totalElements,
        });
      } else {
        throw new Error("Response không đúng định dạng");
      }
    } catch (error: unknown) {
      const { message, errorCode } = extractErrorMessage(error);
      const errorObj = error as { status?: string };

      if (errorObj.status === "401 UNAUTHORIZED" || message.includes("401")) {
        api.error({
          message: "Phiên đăng nhập đã hết hạn",
          description: "Vui lòng đăng nhập lại",
          placement: "topRight",
          duration: 3,
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        api.error({
          message: errorCode || "Lỗi",
          description: message,
          placement: "topRight",
          duration: 5,
        });
      }
    } finally {
      setLoading(false);
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
      const { message, errorCode } = extractErrorMessage(error);
      api.error({
        message: errorCode || "Lỗi",
        description: message,
        placement: "topRight",
        duration: 5,
      });
    }
  };

  const columns: ColumnsType<UserDTO> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
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
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            alt="Avatar"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: "8px" }}
            preview={false}
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
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "ADMIN" ? "red" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            onClick={() => {
              handleOpenUpdateModal();
              setDataDetailModal(record);
            }}
            style={{
              cursor: "pointer",
              color: "var(--color-primary)",
              fontSize: "16px",
            }}
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

  const handleTableChange: TableProps<UserDTO>["onChange"] = (
    paginationInfo
  ) => {
    const newPage = paginationInfo.current || 1;
    const newPageSize = paginationInfo.pageSize || 10;
    fetchUsers(newPage, newPageSize);
  };

  React.useEffect(() => {
    fetchUsers(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div style={{ padding: "0 20px 20px 20px" }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            Thêm user
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataUserTable}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên tổng ${total} người dùng`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          bordered
        />
      </div>
    </>
  );
};

export default UserAdminMain;
