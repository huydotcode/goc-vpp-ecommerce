/**
 * Utility functions to store and retrieve PayOS checkout URLs in localStorage
 */

const PAYOS_URL_PREFIX = "payos_url_";

/**
 * Save PayOS checkout URL for an order
 * @param orderCode - The order code
 * @param checkoutUrl - The PayOS checkout URL
 */
export const savePayOSUrl = (orderCode: string, checkoutUrl: string): void => {
  try {
    localStorage.setItem(`${PAYOS_URL_PREFIX}${orderCode}`, checkoutUrl);
  } catch (error) {
    console.error("Error saving PayOS URL to localStorage:", error);
  }
};

/**
 * Get PayOS checkout URL for an order
 * @param orderCode - The order code
 * @returns The PayOS checkout URL or null if not found
 */
export const getPayOSUrl = (orderCode: string): string | null => {
  try {
    return localStorage.getItem(`${PAYOS_URL_PREFIX}${orderCode}`);
  } catch (error) {
    console.error("Error getting PayOS URL from localStorage:", error);
    return null;
  }
};

/**
 * Remove PayOS checkout URL for an order
 * @param orderCode - The order code
 */
export const removePayOSUrl = (orderCode: string): void => {
  try {
    localStorage.removeItem(`${PAYOS_URL_PREFIX}${orderCode}`);
  } catch (error) {
    console.error("Error removing PayOS URL from localStorage:", error);
  }
};

/**
 * Check if PayOS URL exists for an order
 * @param orderCode - The order code
 * @returns true if URL exists, false otherwise
 */
export const hasPayOSUrl = (orderCode: string): boolean => {
  return getPayOSUrl(orderCode) !== null;
};
