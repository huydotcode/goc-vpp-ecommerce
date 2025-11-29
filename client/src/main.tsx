import { ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import viVN from "antd/es/locale/vi_VN";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider locale={viVN}>
      <App />
    </ConfigProvider>
  </StrictMode>
);
