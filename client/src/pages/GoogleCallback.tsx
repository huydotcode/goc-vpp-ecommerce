import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin } from "antd";
import { toast } from "sonner";
import apiClient from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { loadUserInfo } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const code = searchParams.get("code");
    const accessToken = searchParams.get("accessToken");
    const error = searchParams.get("error");
    const format = searchParams.get("format") || "json";

    // Handle error from server
    if (error) {
      hasProcessed.current = true;
      toast.error(decodeURIComponent(error));
      navigate("/login", { replace: true });
      setLoading(false);
      return;
    }

    // Case 1: Direct redirect from server with accessToken
    if (accessToken) {
      hasProcessed.current = true;
      // Clean token trước khi lưu
      const cleanToken = accessToken.trim().replace(/^["']|["']$/g, "");
      localStorage.setItem("accessToken", cleanToken);
      toast.success("Đăng nhập Google thành công!");
      // Load user info and navigate based on role
      loadUserInfo()
        .then((userInfo) => {
          if (userInfo?.role === "ADMIN" || userInfo?.role === "EMPLOYEE") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        })
        .catch(() => {
          navigate("/", { replace: true });
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    // Case 2: Have code from Google, need to exchange for token
    if (!code) {
      hasProcessed.current = true;
      toast.error("Không có authorization code từ Google");
      navigate("/login", { replace: true });
      setLoading(false);
      return;
    }

    const handleCallback = async () => {
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      try {
        const response = (await apiClient.get(
          `/google/redirect?code=${code}&format=${format}`
        )) as unknown as { accessToken: string; user?: unknown };

        if (response && response.accessToken) {
          // Clean token trước khi lưu
          const cleanToken = response.accessToken
            .trim()
            .replace(/^["']|["']$/g, "");
          localStorage.setItem("accessToken", cleanToken);
          toast.success("Đăng nhập Google thành công!");
          // Load user info and navigate based on role
          const userInfo = await loadUserInfo();
          if (userInfo?.role === "ADMIN" || userInfo?.role === "EMPLOYEE") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          throw new Error("Không nhận được access token");
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error?.message || "Đăng nhập Google thất bại");
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" tip="Đang xử lý đăng nhập Google..." />
      </div>
    );
  }

  return null;
};

export default GoogleCallback;
