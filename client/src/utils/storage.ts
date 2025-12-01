const TOKEN_KEY = "accessToken";

export const storage = {
  /**
   * Get JWT token from localStorage
   */
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set JWT token to localStorage
   */
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Remove JWT token from localStorage
   */
  removeToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if user is authenticated (has token)
   */
  hasToken: (): boolean => {
    return !!storage.getToken();
  },
};
