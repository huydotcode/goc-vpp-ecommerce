import React, { useRef, useState } from 'react';
import {
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, notification, Image } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { promotionService } from '../../../services/promotion.service';
import type { PromotionDTO } from '../../../services/promotion.service';
import { extractErrorMessage } from '../../../utils/errorHandler';
import PromotionDetail from './detail.promotion';
import PromotionCreate from './create-modal.promotion';
import PromotionUpdate from './update.promotion';

const PromotionAdminMain: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [api, contextHolder] = notification.useNotification();
  const requestIdRef = useRef<number>(0);

  const reload = async () => {
    console.log('🔄 [Promotion Table] Reloading table...');
    await actionRef.current?.reload();
  };

  const [isOpenDetailModal, setIsOpenDetailModal] = useState<boolean>(false);
  const [dataDetailModal, setDataDetailModal] = useState<PromotionDTO | null>(null);

  const handleOpenDetailModal = (record: PromotionDTO) => {
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


  const columns: ProColumns<PromotionDTO>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      copyable: true,
      sorter: true,
      valueType: 'digit',
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
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.thumbnailUrl ? (
          <Image
            src={record.thumbnailUrl}
            alt="Thumbnail"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            N/A
          </div>
        ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      copyable: true,
      sorter: true,
    },
    {
      title: 'Loại giảm giá',
      dataIndex: 'discountType',
      key: 'discountType',
      valueType: 'select',
      valueEnum: {
        DISCOUNT_AMOUNT: { text: 'Giảm giá' },
        GIFT: { text: 'Quà tặng' },
      },
      render: (_, record) => (
        <Tag color={record.discountType === 'DISCOUNT_AMOUNT' ? 'blue' : 'orange'}>
          {record.discountType === 'DISCOUNT_AMOUNT' ? 'Giảm giá' : 'Quà tặng'}
        </Tag>
      ),
    },
    {
      title: 'Số tiền giảm',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      hideInSearch: true,
      render: (_, record) =>
        record.discountAmount
          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.discountAmount)
          : 'N/A',
    },
    {
      title: 'Số điều kiện',
      dataIndex: 'conditions',
      key: 'conditions',
      hideInSearch: true,
      render: (_, record) => record.conditions?.length || 0,
    },
    {
      title: 'Số quà tặng',
      dataIndex: 'giftItems',
      key: 'giftItems',
      hideInSearch: true,
      render: (_, record) => record.giftItems?.length || 0,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Active' },
        false: { text: 'Inactive' },
      },
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            onClick={() => {
              handleOpenUpdateModal();
              setDataDetailModal(record);
            }}
            style={{ cursor: 'pointer', color: '#ff5733', fontSize: '16px' }}
          />
          <MoreOutlined
            style={{ cursor: 'pointer', color: '#ff5733', fontSize: '16px' }}
            onClick={() => handleOpenDetailModal(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <h1 style={{ padding: '20px' }}>Quản lý khuyến mãi</h1>
      <PromotionDetail
        isOpenDetailModal={isOpenDetailModal}
        setIsOpenDetailModal={setIsOpenDetailModal}
        dataDetailModal={dataDetailModal}
        setDataDetailModal={setDataDetailModal}
      />

      <PromotionCreate
        isOpenCreateModal={isOpenCreateModal}
        setIsOpenCreateModal={setIsOpenCreateModal}
        reload={reload}
      />

      <PromotionUpdate
        isOpenUpdateModal={isOpenUpdateModal}
        setIsOpenUpdateModal={setIsOpenUpdateModal}
        reload={reload}
        dataDetailModal={dataDetailModal}
      />

      <div style={{ padding: '0 20px 20px 20px' }}>
        <ProTable<PromotionDTO>
          actionRef={actionRef}
          columns={columns}
          request={async (params, sort) => {
            const currentRequestId = ++requestIdRef.current;
            
            try {
                  // Xử lý sort từ ProTable
                  let sortField = 'id';
                  let sortDirection = 'asc';
                  
                  if (sort && Object.keys(sort).length > 0) {
                    const sortKey = Object.keys(sort)[0];
                    const sortValue = sort[sortKey];
                    sortField = sortKey;
                    sortDirection = sortValue === 'ascend' ? 'asc' : 'desc';
                  }

                  const queryParams: {
                    page?: number;
                    size?: number;
                    sort?: string;
                    direction?: string;
                    id?: number;
                    name?: string;
                    isActive?: boolean;
                    search?: string;
                  } = {
                    page: params.current || 1,
                    size: params.pageSize || 10,
                    sort: sortField,
                    direction: sortDirection,
                  };

                  // Log để debug
                  console.log(`🔍 [Promotion Table #${currentRequestId}] Request params:`, {
                    params,
                    sort,
                    queryParams: { ...queryParams },
                  });

                  if (params.id) {
                    queryParams.id = Number(params.id);
                  }
                  if (params.name) {
                    queryParams.name = params.name;
                  }
                  if (params.isActive !== undefined) {
                    queryParams.isActive = params.isActive;
                  }

                  console.log(`📤 [Promotion Table #${currentRequestId}] Sending request:`, queryParams);
                  const startTime = Date.now();
                  
                  const response = await promotionService.getAllPromotions(queryParams);
                  
                  // Kiểm tra nếu request này đã bị override bởi request mới hơn
                  if (currentRequestId !== requestIdRef.current) {
                    console.log(`⚠️ [Promotion Table #${currentRequestId}] Request bị hủy, có request mới hơn`);
                    return {
                      data: [],
                      success: false,
                      total: 0,
                    };
                  }
                  
                  const endTime = Date.now();
                  console.log(`📥 [Promotion Table #${currentRequestId}] Response:`, {
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
                  const { message, errorCode, isAccessDenied } = extractErrorMessage(error);
                  api.error({
                    message: isAccessDenied ? 'Không có quyền' : (errorCode || 'Lỗi'),
                    description: message,
                    placement: 'topRight',
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
                labelWidth: 'auto',
                optionRender: (_searchConfig, _formProps, dom) => [
                  ...dom.reverse(),
                ],
              }}
              debounceTime={300}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} khuyến mãi`,
              }}
              dateFormatter="string"
              headerTitle="Danh sách khuyến mãi"
              toolBarRender={() => [
                <Button
                  key="button"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreateModal}
                  type="primary"
                >
                  Thêm khuyến mãi
                </Button>,
              ]}
              scroll={{ x: 'max-content' }}
              bordered
              cardBordered
            />
      </div>
    </>
  );
};

export default PromotionAdminMain;

