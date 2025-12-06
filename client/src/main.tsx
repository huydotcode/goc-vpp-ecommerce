import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import viVN from "antd/es/locale/vi_VN";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { Toaster } from "sonner";

// Ant Design theme config - Tone màu đỏ
const antdTheme = {
  token: {
    // Colors - Red theme
    colorPrimary: "#ef4444",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#dc2626",
    colorInfo: "#1890ff",

    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Font
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,

    // Component specific
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },
  components: {
    Button: {
      borderRadius: 6,
      primaryShadow: "0 2px 0 rgba(239, 68, 68, 0.1)", // Shadow màu đỏ
    },
    Input: {
      borderRadius: 6,
      activeBorderColor: "#ef4444", // Đỏ
      hoverBorderColor: "#f87171", // Đỏ nhạt
    },
    Card: {
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    Table: {
      borderRadius: 8,
    },
  },
  algorithm: theme.defaultAlgorithm,
};

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        <AntdApp>
          <Toaster
            position="bottom-left"
            richColors
            closeButton
            duration={3000}
          />
          <App />
        </AntdApp>
      </ConfigProvider>
    </StrictMode>
  </QueryClientProvider>
);
