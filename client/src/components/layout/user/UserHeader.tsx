import {
  CloseOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { InputRef, MenuProps } from "antd";
import { Avatar, Button, Dropdown, Input, Layout } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import CategoryMenu from "./CategoryMenu";
import UserCart from "./UserCart";

const { Header } = Layout;

const { Search } = Input;

const UserHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user && isAuthenticated);
  const [searchValue, setSearchValue] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<InputRef>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/products?search=${encodeURIComponent(value.trim())}`);
      setIsMobileSearchOpen(false);
      setSearchValue("");
    }
  };

  const handleOpenMobileSearch = () => {
    setIsMobileSearchOpen(true);
  };

  const handleCloseMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchValue("");
  };

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
      document.body.style.overflow = "hidden"; // Prevent body scroll
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMobileSearchOpen]);

  // Đóng mobile search khi chuyển sang desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      // md breakpoint trong Tailwind là 768px
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
      <div className="mx-auto flex h-full w-full max-w-[1250px] items-center justify-between md:gap-4 px-4 md:px-6">
        {/* Left Section: Logo + Categories */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Logo Section */}
          <div
            className="relative h-full cursor-pointer transition-opacity hover:opacity-80 shrink-0"
            onClick={() => navigate("/")}
          >
            <Link className="flex h-full items-center" to={"/"}>
              {/* Desktop logo */}
              <img
                className="logo-desktop hidden h-full w-auto object-cover lg:block"
                src={"/images/logo.png"}
                alt="Góc VPP Logo"
                style={{ maxHeight: "64px", padding: "8px 0" }}
              />
              {/* Mobile logo icon */}
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
          className="hidden md:flex flex-1 justify-center mx-2 md:mx-4"
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
            style={{
              width: "100%",
            }}
          />
        </div>

        {/* Right Section */}
        <div
          className="flex items-center gap-2 md:gap-4 shrink-0"
          style={{
            height: "100%",
          }}
        >
          {/* Mobile Search Icon Button */}
          <div className="md:hidden">
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: "20px" }} />}
              onClick={handleOpenMobileSearch}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                width: "40px",
                padding: 0,
              }}
              className="hover:bg-gray-50"
            />
          </div>
          {/* Cart Button with Dropdown (always visible) */}
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
                padding: "0 8px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "100%",
                boxSizing: "border-box",
              }}
              className="hover:bg-gray-50"
            >
              {isLoggedIn ? (
                <>
                  <Avatar
                    src={user?.avatarUrl}
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
                    className="hidden md:block font-medium"
                    style={{
                      color: "#212121",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.username || user?.email}
                  </span>
                </>
              ) : (
                <>
                  <Avatar
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
                    className="hidden md:block font-medium"
                    style={{
                      color: "#212121",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Tài khoản
                  </span>
                </>
              )}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Search Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            className="mobile-search-overlay fixed inset-0 z-9999"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseMobileSearch}
          >
            {/* Search Bar Container - Fixed đè lên header */}
            <motion.div
              className="bg-white shadow-lg"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10001,
              }}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="flex items-center gap-2 px-4 py-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <Search
                  ref={mobileSearchInputRef}
                  placeholder="Tìm kiếm sản phẩm..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={handleSearch}
                  style={{
                    flex: 1,
                  }}
                  autoFocus
                />
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ fontSize: "20px" }} />}
                  onClick={handleCloseMobileSearch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "40px",
                    width: "40px",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  className="hover:bg-gray-50"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Header>
  );
};

export default UserHeader;
