import { MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Layout, Typography } from "antd";
import React from "react";
import { Link } from "react-router-dom";

const { Footer: AntFooter } = Layout;
const { Text, Title } = Typography;

const UserFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter style={{ background: "#ffffff", color: "#212121" }}>
      <div className="mx-auto max-w-[1250px] px-4 py-8 md:px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block w-full">
              <img
                src="/images/logo-removebg.png"
                alt="Góc VPP Logo"
                className="w-full"
              />
            </Link>
            <Text style={{ fontSize: "0.875rem", color: "#757575" }}>
              Cửa hàng văn phòng phẩm uy tín, đa dạng sản phẩm chất lượng cao
              cho văn phòng và học tập.
            </Text>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <Title
              level={5}
              style={{ margin: 0, color: "#212121", marginBottom: "8px" }}
            >
              Liên kết nhanh
            </Title>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <Title
              level={5}
              style={{ margin: 0, color: "#212121", marginBottom: "8px" }}
            >
              Hỗ trợ khách hàng
            </Title>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/policy"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link
                  to="/return"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  style={{ color: "#757575", transition: "color 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#757575")
                  }
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <Title
              level={5}
              style={{ margin: 0, color: "#212121", marginBottom: "8px" }}
            >
              Thông tin liên hệ
            </Title>
            <ul className="space-y-3 text-sm">
              <li
                className="flex items-start gap-2"
                style={{ color: "#757575" }}
              >
                <PhoneOutlined
                  style={{ marginTop: "0.25rem", color: "#ef4444" }}
                />
                <span>Hotline: 0909 123 456</span>
              </li>
              <li
                className="flex items-start gap-2"
                style={{ color: "#757575" }}
              >
                <MailOutlined
                  style={{ marginTop: "0.25rem", color: "#ef4444" }}
                />
                <span>Email: gocvpp@gmail.com</span>
              </li>
              <li
                className="flex items-start gap-2"
                style={{ color: "#757575" }}
              >
                <span style={{ marginTop: "0.25rem", color: "#ef4444" }}>
                  📍
                </span>
                <span>Địa chỉ: 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t" style={{ borderColor: "#e0e0e0" }} />

        {/* Copyright */}
        <div
          className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row"
          style={{ color: "#9e9e9e" }}
        >
          <Text
            style={{ margin: 0, textAlign: "center", color: "#9e9e9e" }}
            className="md:text-left"
          >
            © {currentYear} Góc VPP. Tất cả quyền được bảo lưu.
          </Text>
          <div className="flex gap-4">
            <Link
              to="/terms"
              style={{ color: "#9e9e9e", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9e9e9e")}
            >
              Điều khoản sử dụng
            </Link>
            <Link
              to="/privacy"
              style={{ color: "#9e9e9e", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9e9e9e")}
            >
              Chính sách riêng tư
            </Link>
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default UserFooter;
