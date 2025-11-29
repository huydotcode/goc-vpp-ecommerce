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
import { userService } from '../../../services/user.service';
import type { CreateUserRequest } from '../../../services/user.service';
import { extractErrorMessage } from '../../../utils/errorHandler';

const { Dragger } = Upload;

interface ImportUserModalProps {
  isOpenImportModal: boolean;
  setIsOpenImportModal: (v: boolean) => void;
  reload: () => void;
}

const ImportUserModal: React.FC<ImportUserModalProps> = ({
  isOpenImportModal,
  setIsOpenImportModal,
  reload,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const [dataImport, setDataImport] = useState<CreateUserRequest[]>([]);

  // Table columns
  const columns: TableProps<CreateUserRequest>['columns'] = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      render: () => '******',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (isActive ? 'Yes' : 'No'),
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
            const jsonData: CreateUserRequest[] = [];
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

                // Map CSV columns to CreateUserRequest
                const isActiveValue = obj.isActive || obj['Trạng thái'];
                let isActive = true; // Default
                if (isActiveValue !== undefined && isActiveValue !== '') {
                  if (typeof isActiveValue === 'string') {
                    isActive = isActiveValue.toLowerCase() === 'true';
                  } else if (typeof isActiveValue === 'boolean') {
                    isActive = isActiveValue;
                  }
                }
                
                const roleValue = String(obj.role || obj['Vai trò'] || 'USER').toUpperCase();
                // Không cho phép ADMIN, chuyển thành EMPLOYEE nếu là ADMIN
                const validRole = roleValue === 'ADMIN' ? 'EMPLOYEE' : (roleValue === 'EMPLOYEE' ? 'EMPLOYEE' : 'USER');
                
                const userData: CreateUserRequest = {
                  username: String(obj.username || obj['Tên đăng nhập'] || ''),
                  email: String(obj.email || obj['Email'] || ''),
                  password: String(obj.password || obj['Mật khẩu'] || '123456'), // Default password
                  role: validRole as 'USER' | 'EMPLOYEE',
                  isActive: isActive,
                };

                if (userData.username && userData.email) {
                  jsonData.push(userData);
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

                  // Map Excel columns to CreateUserRequest
                  const username = String(obj.username || obj['Tên đăng nhập'] || '');
                  const email = String(obj.email || obj['Email'] || '');
                  const password = String(obj.password || obj['Mật khẩu'] || '123456');
                  const roleValue = String(obj.role || obj['Vai trò'] || 'USER').toUpperCase();
                  // Không cho phép ADMIN, chuyển thành EMPLOYEE nếu là ADMIN
                  const role = roleValue === 'ADMIN' ? 'EMPLOYEE' : (roleValue === 'EMPLOYEE' ? 'EMPLOYEE' : 'USER');
                  const isActive = obj.isActive !== undefined ? Boolean(obj.isActive) : obj['Trạng thái'] !== undefined ? Boolean(obj['Trạng thái']) : true;
                  
                  const userData: CreateUserRequest = {
                    username,
                    email,
                    password,
                    role: role as 'USER' | 'EMPLOYEE',
                    isActive,
                  };

                  if (userData.username && userData.email) {
                    jsonData.push(userData);
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
        dataImport.map(async (userData) => {
          try {
            await userService.createUser(userData);
            successCount++;
          } catch (error) {
            failCount++;
            console.error('Error creating user:', error);
          }
        })
      );

      api.info({
        message: 'Thông báo',
        description: `Đã tải lên ${successCount} user. Thất bại ${failCount}`,
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
        title="Import người dùng"
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
              href="/templates/sample_users.csv"
              download="sample_users.csv"
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

export default ImportUserModal;

