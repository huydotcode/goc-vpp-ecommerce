import { useCategoriesFilter, useProducts } from "@/hooks";
import type { ProductFilters } from "@/types/product.types";
import {
    AppstoreOutlined,
    FilterOutlined,
    SearchOutlined,
    SortAscendingOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import {
    Button,
    Col,
    Drawer,
    Empty,
    Input,
    Pagination,
    Row,
    Select,
    Slider,
    Space,
    Spin,
    Tag,
    Typography,
    Collapse,
    Divider,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface FilterState {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
}

const Products: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    // Parse URL params
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "36");
    const sortParam = searchParams.get("sort") || "createdAt";
    const directionParam = (searchParams.get("direction") || "desc") as "asc" | "desc";
    const categoryIdParam = searchParams.get("categoryId");
    const searchQueryParam = searchParams.get("search") || "";

    // Filters state
    const [filters, setFilters] = useState<FilterState>({
        categoryId: categoryIdParam ? parseInt(categoryIdParam) : undefined,
        search: searchQueryParam,
    });
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);

    // Initialize search input from URL
    useEffect(() => {
        if (searchQueryParam) {
            setSearchInput(searchQueryParam);
        }
    }, [searchQueryParam]);

    // Fetch categories
    const { data: categories } = useCategoriesFilter({ isActive: true }, true);

    // Build product filters
    const productFilters: ProductFilters = {
        page,
        size,
        sort: sortParam,
        direction: directionParam,
        isActive: true,
        categoryId: filters.categoryId,
        search: filters.search,
    };

    // Fetch products
    const { data: productsData, isLoading } = useProducts(productFilters, true);

    const products = productsData?.result || [];
    const total = productsData?.metadata?.totalElements || 0;

    // Handle search
    const handleSearch = (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length === 0) {
            setSearchInput("");
            setFilters((prev) => ({ ...prev, search: undefined }));
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("search");
            newParams.set("page", "1");
            setSearchParams(newParams);
            return;
        }

        setSearchInput(trimmedValue);
        setFilters((prev) => ({ ...prev, search: trimmedValue }));
        const newParams = new URLSearchParams(searchParams);
        newParams.set("search", trimmedValue);
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle category filter
    const handleCategoryChange = (categoryId?: number) => {
        setFilters((prev) => ({ ...prev, categoryId }));
        const newParams = new URLSearchParams(searchParams);
        if (categoryId) {
            newParams.set("categoryId", categoryId.toString());
        } else {
            newParams.delete("categoryId");
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle sort change
    const handleSortChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);

        switch (value) {
            case "price-asc":
                newParams.set("sort", "price");
                newParams.set("direction", "asc");
                break;
            case "price-desc":
                newParams.set("sort", "price");
                newParams.set("direction", "desc");
                break;
            case "name-asc":
                newParams.set("sort", "name");
                newParams.set("direction", "asc");
                break;
            case "name-desc":
                newParams.set("sort", "name");
                newParams.set("direction", "desc");
                break;
            case "newest":
                newParams.set("sort", "createdAt");
                newParams.set("direction", "desc");
                break;
            case "oldest":
                newParams.set("sort", "createdAt");
                newParams.set("direction", "asc");
                break;
            default:
                break;
        }

        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle pagination
    const handlePageChange = (newPage: number, newSize: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage.toString());
        newParams.set("size", newSize.toString());
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({});
        setPriceRange([0, 1000000]);
        setSearchInput("");
        setSearchParams({});
    };

    // Get current sort value for display
    const getCurrentSortValue = () => {
        if (sortParam === "price") {
            return directionParam === "asc" ? "price-asc" : "price-desc";
        }
        if (sortParam === "name") {
            return directionParam === "asc" ? "name-asc" : "name-desc";
        }
        if (sortParam === "createdAt") {
            return directionParam === "desc" ? "newest" : "oldest";
        }
        return "newest";
    };

    // Filter sidebar content
    const filterContent = (
        <div className="space-y-4">
            <Collapse defaultActiveKey={["1", "2"]} ghost>
                {/* Category Filter */}
                <Panel header={<Text strong>Danh mục</Text>} key="1">
                    <div className="space-y-2">
                        <Button
                            type={!filters.categoryId ? "primary" : "default"}
                            block
                            onClick={() => handleCategoryChange(undefined)}
                            className="text-left"
                        >
                            Tất cả danh mục
                        </Button>
                        {categories?.map((cat) => (
                            <Button
                                key={cat.id}
                                type={filters.categoryId === cat.id ? "primary" : "default"}
                                block
                                onClick={() => handleCategoryChange(cat.id)}
                                className="text-left"
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </Panel>

                {/* Price Range Filter */}
                <Panel header={<Text strong>Khoảng giá</Text>} key="2">
                    <div className="px-2">
                        <Slider
                            range
                            min={0}
                            max={1000000}
                            step={10000}
                            value={priceRange}
                            onChange={(value) => setPriceRange(value as [number, number])}
                            tooltip={{
                                formatter: (value) => `${(value || 0).toLocaleString("vi-VN")}đ`,
                            }}
                        />
                        <div className="mt-2 flex justify-between text-sm text-gray-600">
                            <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                            <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                        </div>
                    </div>
                </Panel>
            </Collapse>

            <Divider />

            {/* Clear Filters Button */}
            <Button
                danger
                block
                icon={<CloseOutlined />}
                onClick={handleClearFilters}
            >
                Xóa tất cả bộ lọc
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <AppstoreOutlined className="text-3xl text-primary" />
                        <Title level={2} style={{ margin: 0 }}>
                            Sản phẩm
                        </Title>
                    </div>

                    {/* Search Bar */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <Space.Compact style={{ width: "100%" }}>
                            <Input
                                size="large"
                                placeholder="Tìm kiếm sản phẩm theo tên..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onPressEnter={(e) => handleSearch(e.currentTarget.value)}
                                prefix={<SearchOutlined className="text-gray-400" />}
                                suffix={
                                    searchInput && (
                                        <CloseOutlined
                                            className="cursor-pointer text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setSearchInput("");
                                                handleSearch("");
                                            }}
                                        />
                                    )
                                }
                            />
                            <Button
                                type="primary"
                                size="large"
                                icon={<SearchOutlined />}
                                onClick={() => handleSearch(searchInput)}
                                loading={isLoading}
                            >
                                Tìm kiếm
                            </Button>
                        </Space.Compact>

                        {/* Active Filters Display */}
                        {(filters.categoryId || filters.search) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Text type="secondary" className="text-xs">
                                    Đang lọc:
                                </Text>
                                {filters.categoryId && (
                                    <Tag
                                        closable
                                        onClose={() => handleCategoryChange(undefined)}
                                        color="blue"
                                    >
                                        {categories?.find((c) => c.id === filters.categoryId)?.name}
                                    </Tag>
                                )}
                                {filters.search && (
                                    <Tag
                                        closable
                                        onClose={() => handleSearch("")}
                                        color="green"
                                    >
                                        Tìm kiếm: "{filters.search}"
                                    </Tag>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex gap-6">
                    {/* Desktop Filter Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden w-64 lg:block"
                    >
                        <div className="sticky top-4 rounded-xl bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <Text strong className="text-lg">
                                    Bộ lọc
                                </Text>
                                <FilterOutlined className="text-primary" />
                            </div>
                            {filterContent}
                        </div>
                    </motion.div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <SortAscendingOutlined className="text-gray-500" />
                                <Text strong>Sắp xếp:</Text>
                                <Select
                                    value={getCurrentSortValue()}
                                    onChange={handleSortChange}
                                    style={{ width: 180 }}
                                    options={[
                                        { label: "Mới nhất", value: "newest" },
                                        { label: "Cũ nhất", value: "oldest" },
                                        { label: "Giá: Thấp → Cao", value: "price-asc" },
                                        { label: "Giá: Cao → Thấp", value: "price-desc" },
                                        { label: "Tên: A → Z", value: "name-asc" },
                                        { label: "Tên: Z → A", value: "name-desc" },
                                    ]}
                                />
                            </div>

                            {/* Mobile Filter Button */}
                            <Button
                                className="lg:hidden"
                                icon={<FilterOutlined />}
                                onClick={() => setFilterDrawerOpen(true)}
                            >
                                Lọc
                            </Button>

                            <Text type="secondary">
                                {isLoading ? "Đang tải..." : `${total} sản phẩm`}
                            </Text>
                        </div>

                        {/* Products Grid */}
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex justify-center py-12">
                                        <Spin size="large" tip="Đang tải sản phẩm..." />
                                    </div>
                                </motion.div>
                            ) : products.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-xl bg-white p-8 shadow-sm"
                                >
                                    <Empty
                                        description={
                                            <div>
                                                <Text>Không tìm thấy sản phẩm nào</Text>
                                                <br />
                                                <Button
                                                    type="link"
                                                    onClick={handleClearFilters}
                                                    className="mt-2"
                                                >
                                                    Xóa bộ lọc
                                                </Button>
                                            </div>
                                        }
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="products"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Row gutter={[16, 16]}>
                                        {products.map((product, index) => (
                                            <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                                >
                                                    <ProductCard product={product} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>

                                    {/* Pagination */}
                                    {total > 0 && (
                                        <div className="mt-8 flex justify-center">
                                            <Pagination
                                                current={page}
                                                pageSize={size}
                                                total={total}
                                                onChange={handlePageChange}
                                                showSizeChanger
                                                showTotal={(total) => `Tổng ${total} sản phẩm`}
                                                pageSizeOptions={["12", "24", "36", "48"]}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Mobile Filter Drawer */}
                <Drawer
                    title="Bộ lọc"
                    placement="left"
                    onClose={() => setFilterDrawerOpen(false)}
                    open={filterDrawerOpen}
                    width={280}
                >
                    {filterContent}
                </Drawer>
            </div>
        </div>
    );
};

export default Products;
