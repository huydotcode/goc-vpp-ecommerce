import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  DatePicker,
  Space,
  Table,
  Tag,
  Typography,
  Divider,
  Spin,
  message,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import dayjs, { Dayjs } from "dayjs";
import * as XLSX from "xlsx";
import { orderApi } from "../api/order.api";
import type {
  OrderStatistics,
  OrderStatisticsByRange,
  DailySale,
} from "../types/order.types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(false);
  const [stats, setStats] = useState<OrderStatistics>({
    todayRevenue: 0,
    todayOrders: 0,
    weekRevenue: 0,
    weekOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    dailySales: [],
  });
  const [rangeStats, setRangeStats] = useState<OrderStatisticsByRange | null>(
    null
  );

  // Fetch default statistics on mount
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await orderApi.getStatistics();
        setStats(data);
      } catch (error) {
        console.error("Lỗi khi lấy thống kê:", error);
        message.error("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (!useDateRange) {
      fetchStatistics();
    }
  }, [useDateRange]);

  const handleApplyDateRange = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning("Vui lòng chọn khoảng thời gian");
      return;
    }

    try {
      setLoading(true);
      setUseDateRange(true);
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      const data = await orderApi.getStatisticsByRange(startDate, endDate);
      setRangeStats(data);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error);
      message.error("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      setUseDateRange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDateRange = () => {
    setUseDateRange(false);
    setRangeStats(null);
    setDateRange([dayjs().startOf("month"), dayjs()]);
  };

  const dailySales: DailySale[] = useDateRange
    ? rangeStats?.dailySales || []
    : stats.dailySales || [];

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Đơn hàng",
      dataIndex: "orders",
      key: "orders",
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (value: number) => (
        <Text strong>{value.toLocaleString("vi-VN")}đ</Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customers",
      key: "customers",
    },
  ];

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      dailySales.map((item) => ({
        "Ngày": item.date,
        "Số đơn hàng": item.orders,
        "Doanh thu (VNĐ)": item.revenue,
        "Số khách hàng": item.customers,
      }))
    );

    // Add summary row
    const totalRevenue = dailySales.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = dailySales.reduce((sum, item) => sum + item.orders, 0);
    const totalCustomers = dailySales.reduce((sum, item) => sum + item.customers, 0);

    XLSX.utils.sheet_add_json(
      worksheet,
      [
        {
          "Ngày": "TỔNG CỘNG",
          "Số đơn hàng": totalOrders,
          "Doanh thu (VNĐ)": totalRevenue,
          "Số khách hàng": totalCustomers,
        },
      ],
      { skipHeader: true, origin: -1 }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo doanh thu");

    const fileName = `BaoCaoDoanhThu_${dayjs().format("DDMMYYYY")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export to PDF (simplified text format)
  const exportToPDF = () => {
    const totalRevenue = dailySales.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = dailySales.reduce((sum, item) => sum + item.orders, 0);

    let content = `PHIẾU TỔNG KẾT DOANH THU\n`;
    content += `Ngày xuất: ${dayjs().format("DD/MM/YYYY HH:mm")}\n`;
    content += `Kỳ báo cáo: ${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}\n\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    content += `TỔNG QUAN\n`;
    content += `- Tổng doanh thu: ${totalRevenue.toLocaleString("vi-VN")}đ\n`;
    content += `- Tổng đơn hàng: ${totalOrders}\n`;
    content += `- Doanh thu trung bình/đơn: ${Math.floor(totalRevenue / totalOrders).toLocaleString("vi-VN")}đ\n\n`;

    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    content += `CHI TIẾT THEO NGÀY\n\n`;

    dailySales.forEach((item) => {
      content += `${item.date}:\n`;
      content += `  • Đơn hàng: ${item.orders}\n`;
      content += `  • Doanh thu: ${item.revenue.toLocaleString("vi-VN")}đ\n`;
      content += `  • Khách hàng: ${item.customers}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCaoDoanhThu_${dayjs().format("DDMMYYYY")}.txt`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Title level={2}>Tổng quan & Thống kê</Title>
          <Text type="secondary">
            Theo dõi doanh thu và đơn hàng của cửa hàng
          </Text>
        </motion.div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>Chọn khoảng thời gian:</Text>
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                format="DD/MM/YYYY"
                disabled={loading}
              />
              <Button
                type="primary"
                onClick={handleApplyDateRange}
                disabled={loading}
              >
                Áp dụng
              </Button>
              {useDateRange && (
                <Button onClick={handleResetDateRange} disabled={loading}>
                  Đặt lại
                </Button>
              )}
              <Divider type="vertical" />
              <Button
                type="default"
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={loading}
              >
                Xuất Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
                disabled={loading}
              >
                Xuất Phiếu Tổng Kết
              </Button>
            </Space>
            {useDateRange && rangeStats && (
              <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                Đang hiển thị thống kê từ {rangeStats.startDate} đến{" "}
                {rangeStats.endDate}
              </Text>
            )}
          </Space>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          {useDateRange && rangeStats ? (
            /* Date Range Stats */
            <>
              <Col xs={24} sm={12} lg={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={
                        <Text strong>
                          Doanh thu từ {rangeStats.startDate} đến{" "}
                          {rangeStats.endDate}
                        </Text>
                      }
                      value={rangeStats.rangeRevenue}
                      precision={0}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">
                      {rangeStats.rangeOrders} đơn hàng
                    </Text>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12} lg={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={<Text strong>Tổng số ngày</Text>}
                      value={dailySales.length}
                      precision={0}
                      valueStyle={{ color: "#1890ff" }}
                      prefix={<RiseOutlined />}
                      suffix="ngày"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">
                      Trung bình:{" "}
                      {dailySales.length > 0
                        ? Math.round(
                            rangeStats.rangeRevenue / dailySales.length
                          ).toLocaleString("vi-VN")
                        : 0}
                      đ/ngày
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            </>
          ) : (
            /* Default Stats */
            <>
              {/* Today Stats */}
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={<Text strong>Doanh thu hôm nay</Text>}
                      value={stats.todayRevenue}
                      precision={0}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">{stats.todayOrders} đơn hàng</Text>
                  </Card>
                </motion.div>
              </Col>

              {/* Week Stats */}
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={<Text strong>Doanh thu tuần này</Text>}
                      value={stats.weekRevenue}
                      precision={0}
                      valueStyle={{ color: "#1890ff" }}
                      prefix={<RiseOutlined />}
                      suffix="đ"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">{stats.weekOrders} đơn hàng</Text>
                  </Card>
                </motion.div>
              </Col>

              {/* Month Stats */}
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={<Text strong>Doanh thu tháng này</Text>}
                      value={stats.monthRevenue}
                      precision={0}
                      valueStyle={{ color: "#722ed1" }}
                      prefix={<ShoppingCartOutlined />}
                      suffix="đ"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">{stats.monthOrders} đơn hàng</Text>
                  </Card>
                </motion.div>
              </Col>

              {/* Total Stats */}
              <Col xs={24} sm={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card hoverable>
                    <Statistic
                      title={<Text strong>Tổng doanh thu</Text>}
                      value={stats.totalRevenue}
                      precision={0}
                      valueStyle={{ color: "#cf1322" }}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <Text type="secondary">
                      {stats.totalOrders} đơn | {stats.totalCustomers} khách
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            </>
          )}
        </Row>

        {/* Daily Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            title={
              <Text strong>
                {useDateRange && rangeStats
                  ? `Doanh thu từ ${rangeStats.startDate} đến ${rangeStats.endDate}`
                  : "Doanh thu 7 ngày gần nhất"}
              </Text>
            }
            extra={
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
              >
                Tải xuống
              </Button>
            }
          >
            <Table
              dataSource={dailySales}
              columns={columns}
              pagination={false}
              rowKey="date"
              summary={() => {
                const totalRevenue = dailySales.reduce(
                  (sum, item) => sum + item.revenue,
                  0
                );
                const totalOrders = dailySales.reduce(
                  (sum, item) => sum + item.orders,
                  0
                );
                const totalCustomers = dailySales.reduce(
                  (sum, item) => sum + item.customers,
                  0
                );

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>TỔNG CỘNG</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Tag color="blue">
                          <strong>{totalOrders}</strong>
                        </Tag>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong className="text-green-600">
                          {totalRevenue.toLocaleString("vi-VN")}đ
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>{totalCustomers}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
