/**
 * Formatting utilities for dates, numbers, etc.
 */

/**
 * Format date to Vietnamese locale string
 * @param date - Date string or Date object
 * @returns Formatted date string (dd/MM/yyyy HH:mm)
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

/**
 * Format date to short format (dd/MM/yyyy)
 */
export const formatDateShort = (
  date: string | Date | null | undefined
): string => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
};

/**
 * Format number to Vietnamese currency format
 * @param amount - Number to format
 * @returns Formatted currency string (1.000.000 đ)
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "-";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted number string (1.000.000)
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";

  return new Intl.NumberFormat("vi-VN").format(num);
};

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
