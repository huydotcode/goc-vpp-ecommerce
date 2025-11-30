import Exceljs from 'exceljs';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = async (
  data: any[],
  columns: ExportColumn[],
  fileName: string = 'export.xlsx'
) => {
  const workbook = new Exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Set columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
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
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

