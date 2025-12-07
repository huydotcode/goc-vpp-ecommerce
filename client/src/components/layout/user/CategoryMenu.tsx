import { AppstoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Drawer, Dropdown, Menu, Spin } from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNestedCategories } from "../../../hooks/useCategories";
import type { Category } from "../../../types/category.types";

const CategoryMenu: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } =
    useNestedCategories({ isActive: true }, true);

  // Helper function to convert category to menu item (recursive for nested)
  const categoryToMenuItem = (
    category: Category
  ): NonNullable<MenuProps["items"]>[0] => {
    const hasChildren = category.children && category.children.length > 0;

    return {
      key: category.id.toString(),
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={() => {
            navigate(`/products?categoryId=${category.id}`);
            setDrawerOpen(false); // Close drawer on mobile
          }}
        >
          {category.thumbnailUrl && (
            <img
              src={category.thumbnailUrl}
              alt={category.name}
              style={{
                width: "24px",
                height: "24px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          )}
          <span>{category.name}</span>
        </div>
      ),
      children: hasChildren
        ? category.children!.map((child) => categoryToMenuItem(child))
        : undefined,
    };
  };

  // Category menu items (nested structure)
  const categoryMenuItems: MenuProps["items"] = categories
    ? categories.map((category) => categoryToMenuItem(category))
    : [];

  // Don't render if no categories
  if (!categoriesLoading && (!categories || categories.length === 0)) {
    return null;
  }

  const handleButtonClick = () => {
    // On mobile, open drawer; on desktop, dropdown will handle it
    if (window.innerWidth < 768) {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      {/* Desktop: Dropdown */}
      <div className="hidden md:block">
        <Dropdown
          menu={{
            items: categoryMenuItems,
          }}
          placement="bottomLeft"
          trigger={["hover", "click"]}
          dropdownRender={(menu) => (
            <div>
              {categoriesLoading ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <Spin size="small" />
                </div>
              ) : (
                menu
              )}
            </div>
          )}
        >
          <Button
            type="text"
            icon={<AppstoreOutlined style={{ fontSize: "18px" }} />}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "40px",
              padding: "0 12px",
              fontWeight: 500,
            }}
            className="hover:bg-gray-50"
          >
            <span>Danh mục</span>
          </Button>
        </Dropdown>
      </div>

      {/* Mobile: Icon Button + Drawer */}
      <div className="md:hidden">
        <Button
          type="text"
          icon={<AppstoreOutlined style={{ fontSize: "18px" }} />}
          onClick={handleButtonClick}
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

        <Drawer
          title="Danh mục sản phẩm"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={320}
          bodyStyle={{ padding: 0 }}
        >
          {categoriesLoading ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
              }}
            >
              <Spin />
            </div>
          ) : (
            <Menu
              mode="inline"
              items={categoryMenuItems}
              style={{
                border: "none",
                height: "100%",
              }}
            />
          )}
        </Drawer>
      </div>
    </>
  );
};

export default CategoryMenu;
