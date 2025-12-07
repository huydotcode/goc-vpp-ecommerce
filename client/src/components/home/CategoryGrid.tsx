import { useCategoriesFilter } from "@/hooks";
import { RightOutlined } from "@ant-design/icons";
import { Button, Empty, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

interface CategoryGridProps {
  maxItems?: number;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ maxItems = 10 }) => {
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const { data: categories, isLoading } = useCategoriesFilter(
    { isActive: true },
    inView
  );

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/?categoryId=${categoryId}`);
  };

  if (!inView && !categories) {
    return <div ref={ref} className="mb-8 h-40" />;
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="mb-8">
        <Title level={3} className="mb-4">
          Danh mục sản phẩm
        </Title>
        <Empty description="Chưa có danh mục nào" />
      </div>
    );
  }

  // Filter only parent categories (root categories - no parentId)
  const parentCategories = categories.filter(
    (category) => !category.parentId || category.parentId === null
  );

  if (parentCategories.length === 0) {
    return (
      <div className="mb-8">
        <Title level={3} className="mb-4">
          Danh mục sản phẩm
        </Title>
        <Empty description="Chưa có danh mục nào" />
      </div>
    );
  }

  const displayCategories = parentCategories.slice(0, maxItems);

  const showSkeleton = isLoading;

  return (
    <motion.div
      ref={ref}
      className="category-section mb-8 rounded-xl bg-primary p-4 shadow-sm backdrop-blur-sm"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="category-section-inner space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <Title
              level={3}
              className="m-0 "
              style={{
                color: "white",
              }}
            >
              Danh mục sản phẩm
            </Title>
          </div>

          {parentCategories.length > maxItems && (
            <Button
              type="default"
              danger
              className="inline-flex items-center gap-1 rounded-full px-4 py-1 text-sm font-medium"
              onClick={() => navigate("/products")}
            >
              Xem tất cả
              <RightOutlined className="text-xs" />
            </Button>
          )}
        </div>

        <div className="mt-2">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {showSkeleton
              ? Array.from({
                  length: Math.min(displayCategories.length || 8, 8),
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-lg bg-white/50"
                  />
                ))
              : displayCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="h-full cursor-pointer overflow-hidden rounded-lg bg-white text-center shadow-sm"
                    onClick={() => handleCategoryClick(category.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                      inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                    }
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{
                      y: -4,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex h-24 items-center justify-center bg-white md:h-28">
                      {category.thumbnailUrl ? (
                        <img
                          src={category.thumbnailUrl}
                          alt={category.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-3xl font-semibold text-red-400 md:text-4xl">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <span className="block truncate text-sm font-medium leading-snug">
                        {category.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryGrid;
