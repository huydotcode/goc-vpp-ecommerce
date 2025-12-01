import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { storage } from "../utils/storage";

const fullScreenCenterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
};

const RoleBasedRedirect: React.FC = () => {
  const { userRole, isLoading, loadUserInfo } = useAuth();
  const [hasTriedReload, setHasTriedReload] = useState(false);

  if (isLoading) {
    return <div style={fullScreenCenterStyle}>Đang tải...</div>;
  }

  if (!userRole) {
    const token = storage.getToken();

    if (token && !hasTriedReload) {
      setHasTriedReload(true);
      void loadUserInfo().catch((error) => {
        console.error("[RoleBasedRedirect] Failed to reload user info:", error);
      });

      return (
        <div style={fullScreenCenterStyle}>
          Đang tải thông tin người dùng...
        </div>
      );
    }

    if (!token) {
      return <Navigate to="/login" replace />;
    }
  }

  if (userRole === "ADMIN" || userRole === "EMPLOYEE") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/home" replace />;
};

export default RoleBasedRedirect;
