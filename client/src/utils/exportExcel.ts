import Exceljs from "exceljs";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Export data to Excel file
 * @param data - Array of data objects to export
 * @param columns - Column definitions
 * @param fileName - Output file name (default: 'export.xlsx')
 * @throws Error if export fails
 */
export const exportToExcel = async <T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string = "export.xlsx"
): Promise<void> => {
  try {
    const workbook = new Exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Set columns
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data rows
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Auto fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(
          column.width || 15,
          (column.header as string).length + 2
        );
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Download file
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("Không thể xuất file Excel. Vui lòng thử lại.");
  }
};
