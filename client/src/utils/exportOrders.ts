import ExcelJS from "exceljs";

export interface OrderExportData {
  id: number;
  orderCode?: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  userFirstName?: string;
  userLastName?: string;
  items?: {
    productName?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }[];
}

const statusLabelMap: Record<string, string> = {
  COMPLETED: "Hoàn thành",
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const paymentMethodMap: Record<string, string> = {
  COD: "Tiền mặt (COD)",
  PAYOS: "Thanh toán bằng PAYOS",
};

/**
 * Export orders to CSV format
 */
export const exportOrdersToCSV = (
  orders: OrderExportData[],
  filename?: string
): void => {
  const headers = [
    "Mã đơn hàng",
    "Ngày đặt",
    "Khách hàng",
    "Email",
    "Số điện thoại",
    "Tổng tiền",
    "Trạng thái",
    "Phương thức thanh toán",
    "Tài khoản liên kết",
  ];

  const rows = orders.map((order) => [
    order.orderCode || "",
    new Date(order.createdAt).toLocaleString("vi-VN"),
    order.customerName || "",
    order.customerEmail || "",
    order.customerPhone || "",
    order.totalAmount.toLocaleString("vi-VN") + " ₫",
    statusLabelMap[order.status] || order.status,
    paymentMethodMap[order.paymentMethod || ""] || order.paymentMethod || "",
    order.userFirstName && order.userLastName
      ? `${order.userFirstName} ${order.userLastName}`
      : "Khách vãng lai",
  ]);

  // Add BOM for UTF-8 encoding
  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename || `don-hang-${formatDateForFilename()}.csv`);
};

/**
 * Export orders to Excel format with formatting
 */
export const exportOrdersToExcel = async (
  orders: OrderExportData[],
  filename?: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Admin System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Đơn hàng", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Define columns
  worksheet.columns = [
    { header: "Mã đơn hàng", key: "orderCode", width: 18 },
    { header: "Ngày đặt", key: "createdAt", width: 20 },
    { header: "Khách hàng", key: "customerName", width: 25 },
    { header: "Email", key: "customerEmail", width: 30 },
    { header: "Số điện thoại", key: "customerPhone", width: 15 },
    { header: "Tổng tiền", key: "totalAmount", width: 18 },
    { header: "Trạng thái", key: "status", width: 18 },
    { header: "Thanh toán", key: "paymentMethod", width: 25 },
    { header: "Tài khoản", key: "userAccount", width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1890FF" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add data rows
  orders.forEach((order) => {
    const row = worksheet.addRow({
      orderCode: order.orderCode || "",
      createdAt: new Date(order.createdAt).toLocaleString("vi-VN"),
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      totalAmount: order.totalAmount,
      status: statusLabelMap[order.status] || order.status,
      paymentMethod:
        paymentMethodMap[order.paymentMethod || ""] ||
        order.paymentMethod ||
        "",
      userAccount:
        order.userFirstName && order.userLastName
          ? `${order.userFirstName} ${order.userLastName}`
          : "Khách vãng lai",
    });

    // Style status cell based on value
    const statusCell = row.getCell("status");
    const statusColors: Record<string, string> = {
      COMPLETED: "FF52C41A",
      PENDING: "FFFAAD14",
      PAID: "FF13C2C2",
      CONFIRMED: "FF1890FF",
      SHIPPING: "FF1890FF",
      DELIVERED: "FF722ED1",
      CANCELLED: "FFFF4D4F",
      REFUNDED: "FFFA8C16",
    };
    if (statusColors[order.status]) {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusColors[order.status] },
      };
      statusCell.font = { color: { argb: "FFFFFFFF" } };
    }

    // Format currency
    const amountCell = row.getCell("totalAmount");
    amountCell.numFmt = "#,##0 ₫";
    amountCell.alignment = { horizontal: "right" };
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Add summary row
  const summaryRow = worksheet.addRow({});
  summaryRow.getCell(1).value = `Tổng: ${orders.length} đơn hàng`;
  summaryRow.getCell(1).font = { bold: true };
  summaryRow.getCell(6).value = orders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );
  summaryRow.getCell(6).numFmt = "#,##0 ₫";
  summaryRow.getCell(6).font = { bold: true };

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename || `don-hang-${formatDateForFilename()}.xlsx`);
};

/**
 * Export orders with items detail to Excel
 */
export const exportOrdersDetailedToExcel = async (
  orders: OrderExportData[],
  filename?: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Admin System";
  workbook.created = new Date();

  // Sheet 1: Order Summary
  const summarySheet = workbook.addWorksheet("Tổng hợp đơn hàng");
  summarySheet.columns = [
    { header: "Mã đơn hàng", key: "orderCode", width: 18 },
    { header: "Ngày đặt", key: "createdAt", width: 20 },
    { header: "Khách hàng", key: "customerName", width: 25 },
    { header: "Số điện thoại", key: "customerPhone", width: 15 },
    { header: "Tổng tiền", key: "totalAmount", width: 18 },
    { header: "Trạng thái", key: "status", width: 18 },
  ];

  // Style header
  const headerRow = summarySheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1890FF" },
  };

  orders.forEach((order) => {
    summarySheet.addRow({
      orderCode: order.orderCode,
      createdAt: new Date(order.createdAt).toLocaleString("vi-VN"),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      status: statusLabelMap[order.status] || order.status,
    });
  });

  // Sheet 2: Order Items Detail
  const itemsSheet = workbook.addWorksheet("Chi tiết sản phẩm");
  itemsSheet.columns = [
    { header: "Mã đơn hàng", key: "orderCode", width: 18 },
    { header: "Sản phẩm", key: "productName", width: 50 },
    { header: "Số lượng", key: "quantity", width: 12 },
    { header: "Đơn giá", key: "unitPrice", width: 15 },
    { header: "Thành tiền", key: "subtotal", width: 15 },
  ];

  const itemsHeaderRow = itemsSheet.getRow(1);
  itemsHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  itemsHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF52C41A" },
  };

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      itemsSheet.addRow({
        orderCode: order.orderCode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      });
    });
  });

  // Format currency columns
  itemsSheet.getColumn("unitPrice").numFmt = "#,##0 ₫";
  itemsSheet.getColumn("subtotal").numFmt = "#,##0 ₫";

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(
    blob,
    filename || `don-hang-chi-tiet-${formatDateForFilename()}.xlsx`
  );
};

// Helper functions
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateForFilename(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}
