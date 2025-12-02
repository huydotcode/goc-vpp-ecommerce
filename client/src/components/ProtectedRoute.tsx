import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?:
    | "ADMIN"
    | "EMPLOYEE"
    | "USER"
    | ("ADMIN" | "EMPLOYEE" | "USER")[];
  allowedRoles?: ("ADMIN" | "EMPLOYEE" | "USER")[];
  allowGuest?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireRole,
  allowedRoles,
  allowGuest = false,
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        Đang tải...
      </div>
    );
  }

  // Nếu allowGuest = true, cho phép guest truy cập
  if (allowGuest) {
    // Nếu đã đăng nhập, vẫn kiểm tra role nếu có
    if (isAuthenticated) {
      if (allowedRoles && userRole) {
        if (!allowedRoles.includes(userRole)) {
          return <Navigate to="/403" replace />;
        }
      }
      if (requireRole) {
        const requiredRoles = Array.isArray(requireRole)
          ? requireRole
          : [requireRole];
        if (!userRole || !requiredRoles.includes(userRole)) {
          return <Navigate to="/403" replace />;
        }
      }
      if (requireAdmin) {
        if (!userRole || (userRole !== "ADMIN" && userRole !== "EMPLOYEE")) {
          return <Navigate to="/403" replace />;
        }
      }
    }
    // Guest hoặc đã pass role check → cho phép truy cập
    return <>{children}</>;
  }

  // Logic cũ cho protected routes (yêu cầu đăng nhập)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (allowedRoles && userRole) {
    if (!allowedRoles.includes(userRole)) {
      // Không có quyền, redirect về 403
      return <Navigate to="/403" replace />;
    }
  }

  // Kiểm tra requireRole (single role hoặc array)
  if (requireRole) {
    const requiredRoles = Array.isArray(requireRole)
      ? requireRole
      : [requireRole];
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Không có quyền, redirect về 403
      return <Navigate to="/403" replace />;
    }
  }

  // Kiểm tra requireAdmin (chỉ ADMIN và EMPLOYEE)
  if (requireAdmin) {
    if (!userRole || (userRole !== "ADMIN" && userRole !== "EMPLOYEE")) {
      // Không có quyền, redirect về 403
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
};
