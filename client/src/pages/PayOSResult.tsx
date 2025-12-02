import { Alert, Button, Card } from "antd";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PayOSResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status") || "failed";
  const message = searchParams.get("message") || "";
  const orderCode = searchParams.get("orderCode") || "";
  const code = searchParams.get("code") || "";
  const id = searchParams.get("id") || "";

  const isSuccess = status === "success";

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Card title={message.includes("COD") ? "Ket qua dat hang COD" : "Ket qua thanh toan PayOS"}>
          <Alert
            type={isSuccess ? "success" : "error"}
            message={isSuccess 
              ? (message.includes("COD") ? "Dat hang COD thanh cong" : "Thanh toan thanh cong")
              : "Thanh toan that bai"}
            description={
              <div>
                <p>{message}</p>
                {orderCode && (
                  <p>
                    <strong>Ma don hang:</strong> {orderCode}
                  </p>
                )}
                {id && (
                  <p>
                    <strong>Payment ID:</strong> {id}
                  </p>
                )}
                {code && (
                  <p>
                    <strong>Ma PayOS (code):</strong> {code}
                  </p>
                )}
                {message.includes("COD") && (
                  <div style={{ marginTop: 16, padding: 12, background: "#f0f0f0", borderRadius: 4 }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>Luu y:</p>
                    <p style={{ margin: "8px 0 0 0" }}>
                      Don hang COD da duoc tao. Ban se tra tien khi nhan hang.
                    </p>
                  </div>
                )}
              </div>
            }
            showIcon
          />
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Button type="primary" onClick={() => navigate("/cart-vnpay")}>
              Quay lai gio hang mock
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PayOSResult;

