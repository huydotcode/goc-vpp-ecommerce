import {
  ClearOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Input, Row, Select } from "antd";
import React, { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { CategoryDTO } from "@/services/category.service";

const { Search } = Input;
const { Option } = Select;

interface SearchFilterBarProps {
  searchTerm: string;
  selectedCategory?: number;
  sortBy?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId?: number) => void;
  onSortChange?: (sortBy: string) => void;
  categories?: CategoryDTO[];
  loading?: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  selectedCategory,
  sortBy = "default",
  onSearchChange,
  onCategoryChange,
  onSortChange,
  categories = [],
  loading = false,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  const handleClearFilters = () => {
    setLocalSearchTerm("");
    onSearchChange("");
    onCategoryChange(undefined);
    if (onSortChange) {
      onSortChange("default");
    }
  };

  const hasActiveFilters =
    localSearchTerm || selectedCategory || sortBy !== "default";

  return (
    <Card className="mb-6 sticky top-0 z-10 shadow-sm">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Chọn danh mục"
            allowClear
            size="large"
            style={{ width: "100%" }}
            value={selectedCategory}
            onChange={onCategoryChange}
            loading={loading}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Sắp xếp"
            size="large"
            style={{ width: "100%" }}
            value={sortBy}
            onChange={onSortChange}
            suffixIcon={<SortAscendingOutlined />}
          >
            <Option value="default">Mặc định</Option>
            <Option value="price_asc">Giá: Thấp → Cao</Option>
            <Option value="price_desc">Giá: Cao → Thấp</Option>
            <Option value="newest">Mới nhất</Option>
            <Option value="popular">Bán chạy</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Button
            type="default"
            size="large"
            icon={<ClearOutlined />}
            block
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Xóa bộ lọc
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default SearchFilterBar;
