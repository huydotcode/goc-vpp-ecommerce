import { Alert, Button, Card } from "antd";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const VnPayResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status") || "failed";
  const message = searchParams.get("message") || "";
  const orderId = searchParams.get("orderId") || "";
  const code = searchParams.get("code") || "";

  const isSuccess = status === "success";

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Card title="Ket qua thanh toan VNPAY">
          <Alert
            type={isSuccess ? "success" : "error"}
            message={isSuccess ? "Thanh toan thanh cong" : "Thanh toan that bai"}
            description={
              <div>
                <p>{message}</p>
                {orderId && (
                  <p>
                    <strong>Ma don hang:</strong> {orderId}
                  </p>
                )}
                {code && (
                  <p>
                    <strong>Ma VNPAY (vnp_ResponseCode):</strong> {code}
                  </p>
                )}
              </div>
            }
            showIcon
          />
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Button type="primary" onClick={() => navigate("/home/cart-vnpay")}>
              Quay lai gio hang mock
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VnPayResult;


