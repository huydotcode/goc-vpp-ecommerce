import {
  AppstoreOutlined,
  CloseOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { InputRef, MenuProps } from "antd";
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Input,
  Layout,
  List,
  Spin,
  Typography,
} from "antd";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useProductVectorSuggestions } from "../../../hooks";
import type { Product } from "../../../types/product.types";
import CategoryMenu from "./CategoryMenu";
import UserCart from "./UserCart";

const { Header } = Layout;
const { Search } = Input;
const { Text } = Typography;

const UserHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user && isAuthenticated);
  const [searchValue, setSearchValue] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const mobileSearchInputRef = useRef<InputRef>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // AI-powered search suggestions hook
  const { data: products, isLoading } = useProductVectorSuggestions(
    { q: searchValue, limit: 5 },
    searchValue.trim().length > 0
  );

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
    setSearchValue("");
    setShowResults(false);
    setIsMobileSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      // Redirect to products page with search query (Shopee-style)
      navigate(`/products?search=${encodeURIComponent(trimmedValue)}`);
      setSearchValue("");
      setShowResults(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleOpenMobileSearch = () => {
    setIsMobileSearchOpen(true);
  };

  const handleCloseMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchValue("");
    setShowResults(false);
  };

  const handleViewAllResults = () => {
    if (searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setShowResults(false);
      setIsMobileSearchOpen(false);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResults]);

  // Auto focus input khi mở mobile search
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  // Đóng mobile search khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileSearchOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest(".mobile-search-overlay")) {
          handleCloseMobileSearch();
        }
      }
    };

    if (isMobileSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMobileSearchOpen]);

  // Đóng mobile search khi chuyển sang desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileSearchOpen) {
        handleCloseMobileSearch();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileSearchOpen]);

  const authenticatedMenuItems: MenuProps["items"] = [
    ...(user?.role && ["ADMIN", "EMPLOYEE"].includes(user.role)
      ? [
          {
            key: "admin",
            label: "Trang quản trị",
            icon: <AppstoreOutlined />,
            onClick: () => {
              navigate("/admin");
            },
          },
        ]
      : []),
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => {
        navigate("/user/profile");
      },
    },
    {
      key: "orders",
      label: "Đơn hàng của tôi",
      icon: <ShoppingOutlined />,
      onClick: () => {
        navigate("/user/orders");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const guestMenuItems: MenuProps["items"] = [
    {
      key: "login",
      label: "Đăng nhập",
      icon: <UserOutlined />,
      onClick: () => navigate("/login"),
    },
    {
      key: "register",
      label: "Đăng ký",
      icon: <UserOutlined />,
      onClick: () => navigate("/register"),
    },
  ];

  const renderProductItem = (product: Product) => (
    <List.Item
      key={product.id}
      onClick={() => handleProductClick(product.id)}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ borderBottom: "1px solid #f0f0f0", padding: "12px 16px" }}
    >
      <List.Item.Meta
        avatar={
          <img
            src={product.thumbnailUrl || "/placeholder.png"}
            alt={product.name}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        }
        title={
          <Text
            strong
            className="text-sm"
            style={{ display: "block", marginBottom: "4px" }}
          >
            {product.name}
          </Text>
        }
        description={
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Text type="secondary" className="text-xs">
              {product.brand || "N/A"}
            </Text>
            <Text
              strong
              style={{ color: "var(--color-primary)", fontSize: "14px" }}
            >
              {product.price?.toLocaleString("vi-VN")}đ
            </Text>
          </div>
        }
      />
    </List.Item>
  );

  return (
    <Header
      style={{
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: 0,
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1250px] items-center justify-between gap-2 md:gap-4 px-4 md:px-6">
        {/* Left Section: Logo + Categories */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Logo Section */}
          <div
            className="relative h-full cursor-pointer transition-opacity hover:opacity-80 shrink-0"
            onClick={() => navigate("/")}
          >
            <Link className="flex h-full items-center" to={"/"}>
              <img
                className="logo-desktop hidden h-full w-auto object-cover lg:block"
                src={"/images/logo.png"}
                alt="Góc VPP Logo"
                style={{ maxHeight: "64px", padding: "8px 0" }}
              />
              <img
                className="logo-mobile h-10 w-10 object-cover lg:hidden"
                src={"/images/logo-icon.png"}
                alt="Góc VPP Logo"
              />
            </Link>
          </div>

          {/* Categories Dropdown */}
          <CategoryMenu />
        </div>

        {/* Search Bar - Desktop Only */}
        <div
          ref={searchContainerRef}
          className="hidden md:flex flex-1 justify-center mx-2 relative"
          style={{ maxWidth: "500px" }}
        >
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            onFocus={() => {
              if (searchValue) {
                setShowResults(true);
              }
            }}
            style={{ width: "100%" }}
          />

          {/* Search Results Dropdown */}
          {showResults && searchValue && (
            <div
              className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
              style={{
                left: "0",
                right: "0",
                minWidth: "100%",
                maxHeight: "500px",
              }}
            >
              <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                <Text strong>Kết quả tìm kiếm</Text>
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {isLoading ? (
                  <div className="py-12 text-center">
                    <Spin tip="Đang tìm kiếm..." />
                  </div>
                ) : products && products.length > 0 ? (
                  <>
                    <List
                      dataSource={products}
                      renderItem={renderProductItem}
                      style={{ padding: 0 }}
                    />
                    <div
                      className="px-4 py-3 bg-gray-50 border-t text-center cursor-pointer hover:bg-gray-100"
                      onClick={handleViewAllResults}
                    >
                      <Text type="secondary" className="text-sm">
                        Xem tất cả kết quả →
                      </Text>
                    </div>
                  </>
                ) : (
                  <div className="py-8">
                    <Empty description="Không tìm thấy sản phẩm" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Mobile Search Icon Button */}
          <div className="md:hidden">
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: "18px" }} />}
              onClick={handleOpenMobileSearch}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                width: "40px",
                padding: 0,
                borderRadius: "8px",
              }}
              className="hover:bg-gray-100"
            />
          </div>

          {/* Cart Button */}
          <UserCart />

          {/* User Dropdown */}
          <Dropdown
            menu={{
              items: isLoggedIn ? authenticatedMenuItems : guestMenuItems,
            }}
            placement="bottomRight"
          >
            <div
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "40px",
                boxSizing: "border-box",
              }}
              className="hover:bg-gray-100"
            >
              <Avatar
                src={isLoggedIn ? user?.avatarUrl : undefined}
                icon={<UserOutlined />}
                size="default"
                style={{
                  backgroundColor: "var(--color-primary)",
                  border: "2px solid #f0f0f0",
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                }}
              />
              <span
                className="hidden lg:block font-medium"
                style={{
                  color: "#212121",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "nowrap",
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {isLoggedIn ? user?.username || user?.email : "Tài khoản"}
              </span>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Search Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            className="mobile-search-overlay fixed inset-0 z-9999"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseMobileSearch}
          >
            <motion.div
              className="bg-white shadow-lg"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10001,
                maxHeight: "100vh",
                display: "flex",
                flexDirection: "column",
              }}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <Search
                  ref={mobileSearchInputRef}
                  placeholder="Tìm kiếm sản phẩm..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={handleSearch}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ fontSize: "20px" }} />}
                  onClick={handleCloseMobileSearch}
                  style={{
                    height: "40px",
                    width: "40px",
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              </div>

              {searchValue && (
                <div
                  style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
                >
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <Spin tip="Đang tìm kiếm..." />
                    </div>
                  ) : products && products.length > 0 ? (
                    <>
                      <List
                        dataSource={products}
                        renderItem={renderProductItem}
                      />
                      <div
                        className="px-4 py-3 bg-gray-50 border-t text-center"
                        onClick={() => {
                          handleViewAllResults();
                          handleCloseMobileSearch();
                        }}
                      >
                        <Text type="secondary">Xem tất cả kết quả →</Text>
                      </div>
                    </>
                  ) : (
                    <div className="py-8">
                      <Empty description="Không tìm thấy sản phẩm" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Header>
  );
};

export default UserHeader;
