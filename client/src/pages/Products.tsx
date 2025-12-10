import { useCategoriesFilter, useProducts } from "@/hooks";
import type { ProductFilters } from "@/types/product.types";
import {
    SortAscendingOutlined,
    FilterOutlined,
    DollarOutlined,
    AppstoreOutlined,
    DownOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import {
    Button,
    Col,
    Drawer,
    Empty,
    Pagination,
    Row,
    Select,
    Spin,
    Typography,
    Divider,
    InputNumber,
    Space,
    Collapse,
    Tag,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { promotionService } from "@/services/promotion.service";
import type { PromotionResponse } from "@/types/promotion.types";

const { Title, Text } = Typography;

interface FilterState {
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
}

// Predefined price ranges (Shopee-style)
const PRICE_RANGES = [
    { label: "Tất cả mức giá", min: undefined, max: undefined },
    { label: "Dưới 50.000đ", min: undefined, max: 50000 },
    { label: "50.000đ - 100.000đ", min: 50000, max: 100000 },
    { label: "100.000đ - 200.000đ", min: 100000, max: 200000 },
    { label: "200.000đ - 500.000đ", min: 200000, max: 500000 },
    { label: "Trên 500.000đ", min: 500000, max: undefined },
];

const Products: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [customMinPrice, setCustomMinPrice] = useState<number | null>(null);
    const [customMaxPrice, setCustomMaxPrice] = useState<number | null>(null);
    const [activePromotions, setActivePromotions] = useState<PromotionResponse[]>([]);

    useEffect(() => {
        promotionService.getActivePromotions().then(setActivePromotions).catch(console.error);
    }, []);

    // Parse URL params
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "36");
    const sortParam = searchParams.get("sort") || "createdAt";
    const directionParam = (searchParams.get("direction") || "desc") as "asc" | "desc";
    const categoryIdParam = searchParams.get("categoryId");
    const searchQueryParam = searchParams.get("search") || "";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");

    // Filters state
    const [filters, setFilters] = useState<FilterState>({
        categoryId: categoryIdParam ? parseInt(categoryIdParam) : undefined,
        search: searchQueryParam,
        minPrice: minPriceParam ? parseInt(minPriceParam) : undefined,
        maxPrice: maxPriceParam ? parseInt(maxPriceParam) : undefined,
    });

    // Sync filters with URL params when they change
    useEffect(() => {
        setFilters({
            categoryId: categoryIdParam ? parseInt(categoryIdParam) : undefined,
            search: searchQueryParam,
            minPrice: minPriceParam ? parseInt(minPriceParam) : undefined,
            maxPrice: maxPriceParam ? parseInt(maxPriceParam) : undefined,
        });
        // Also update custom price inputs
        setCustomMinPrice(minPriceParam ? parseInt(minPriceParam) : null);
        setCustomMaxPrice(maxPriceParam ? parseInt(maxPriceParam) : null);
    }, [categoryIdParam, searchQueryParam, minPriceParam, maxPriceParam]);

    // Fetch categories
    const { data: categories } = useCategoriesFilter({ isActive: true }, true);

    // Build product filters for API - always use normal API for search
    const productFilters: ProductFilters = {
        page,
        size,
        sort: sortParam,
        direction: directionParam,
        isActive: true,
        categoryId: filters.categoryId,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
    };

    // Fetch products using normal API (for all cases including search)
    const { data: productsData, isLoading } = useProducts(productFilters, true);

    // Get products and total from API response
    const products = productsData?.result || [];
    const total = productsData?.metadata?.totalElements || 0;

    // Handle category change
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

    // Handle clear search
    const handleClearSearch = () => {
        setFilters((prev) => ({ ...prev, search: "" }));
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("search");
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle price range change
    const handlePriceRangeChange = (minPrice?: number, maxPrice?: number) => {
        setFilters((prev) => ({ ...prev, minPrice, maxPrice }));
        const newParams = new URLSearchParams(searchParams);
        if (minPrice !== undefined) {
            newParams.set("minPrice", minPrice.toString());
        } else {
            newParams.delete("minPrice");
        }
        if (maxPrice !== undefined) {
            newParams.set("maxPrice", maxPrice.toString());
        } else {
            newParams.delete("maxPrice");
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle custom price apply
    const handleApplyCustomPrice = () => {
        handlePriceRangeChange(
            customMinPrice ?? undefined,
            customMaxPrice ?? undefined
        );
    };

    // Check if current filter matches a predefined range
    const isRangeActive = (min?: number, max?: number) => {
        return filters.minPrice === min && filters.maxPrice === max;
    };

    // Handle sorting
    const handleSortChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);

        switch (value) {
            case "newest":
                newParams.set("sort", "createdAt");
                newParams.set("direction", "desc");
                break;
            case "oldest":
                newParams.set("sort", "createdAt");
                newParams.set("direction", "asc");
                break;
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
        }

        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // Handle pagination
    const handlePageChange = (newPage: number, newSize?: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage.toString());
        if (newSize) {
            newParams.set("size", newSize.toString());
        }
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
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

    // Get category name by id
    const getCategoryName = (categoryId: number) => {
        const category = categories?.find((c) => c.id === categoryId);
        return category?.name || `Danh mục #${categoryId}`;
    };

    // Get price label
    const getPriceLabel = () => {
        if (filters.minPrice === undefined && filters.maxPrice === undefined) {
            return null;
        }
        // Check if matches a predefined range
        const matchedRange = PRICE_RANGES.find(
            (r) => r.min === filters.minPrice && r.max === filters.maxPrice && (r.min !== undefined || r.max !== undefined)
        );
        if (matchedRange) {
            return matchedRange.label;
        }
        // Custom range
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            return `${filters.minPrice.toLocaleString("vi-VN")}đ - ${filters.maxPrice.toLocaleString("vi-VN")}đ`;
        }
        if (filters.minPrice !== undefined) {
            return `Từ ${filters.minPrice.toLocaleString("vi-VN")}đ`;
        }
        if (filters.maxPrice !== undefined) {
            return `Đến ${filters.maxPrice.toLocaleString("vi-VN")}đ`;
        }
        return null;
    };

    // Check if any filter is active
    const hasActiveFilters = () => {
        return filters.categoryId !== undefined ||
            (filters.search && filters.search.trim() !== "") ||
            filters.minPrice !== undefined ||
            filters.maxPrice !== undefined;
    };

    // Active filter tags component
    const ActiveFilterTags = () => {
        if (!hasActiveFilters()) return null;

        return (
            <div className="mb-4 flex items-center gap-2 flex-wrap rounded-lg bg-white px-3 py-2 shadow-sm">
                <Text type="secondary" className="text-sm">Đang lọc:</Text>

                {/* Search tag */}
                {filters.search && filters.search.trim() !== "" && (
                    <Tag
                        closable
                        onClose={handleClearSearch}
                        color="blue"
                        style={{ margin: 0 }}
                    >
                        Tìm: "{filters.search}"
                    </Tag>
                )}

                {/* Category tag */}
                {filters.categoryId !== undefined && (
                    <Tag
                        closable
                        onClose={() => handleCategoryChange(undefined)}
                        color="green"
                        style={{ margin: 0 }}
                    >
                        {getCategoryName(filters.categoryId)}
                    </Tag>
                )}

                {/* Price range tag */}
                {getPriceLabel() && (
                    <Tag
                        closable
                        onClose={() => handlePriceRangeChange(undefined, undefined)}
                        color="orange"
                        style={{ margin: 0 }}
                    >
                        {getPriceLabel()}
                    </Tag>
                )}

                {/* Clear all button */}
                <Button
                    type="link"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                        handleCategoryChange(undefined);
                        handlePriceRangeChange(undefined, undefined);
                        handleClearSearch();
                    }}
                >
                    Xóa tất cả
                </Button>
            </div>
        );
    };

    // Price filter UI component
    const PriceFilterSection = () => (
        <div className="space-y-2">
            <Text strong className="block mb-2">
                <DollarOutlined className="mr-2" />
                Khoảng giá
            </Text>
            {PRICE_RANGES.map((range, index) => (
                <Button
                    key={index}
                    type={isRangeActive(range.min, range.max) ? "primary" : "default"}
                    block
                    onClick={() => handlePriceRangeChange(range.min, range.max)}
                    className="text-left"
                    size="small"
                >
                    {range.label}
                </Button>
            ))}
            <Divider className="my-2" style={{ margin: "8px 0" }} />
            <Text type="secondary" className="block mb-2 text-xs">
                Hoặc nhập khoảng giá:
            </Text>
            <Space.Compact style={{ width: "100%" }}>
                <InputNumber
                    placeholder="Từ"
                    value={customMinPrice}
                    onChange={(value) => setCustomMinPrice(value)}
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    style={{ width: "50%" }}
                    size="small"
                />
                <InputNumber
                    placeholder="Đến"
                    value={customMaxPrice}
                    onChange={(value) => setCustomMaxPrice(value)}
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    style={{ width: "50%" }}
                    size="small"
                />
            </Space.Compact>
            <Button
                type="primary"
                block
                size="small"
                onClick={handleApplyCustomPrice}
                style={{ marginTop: 8 }}
            >
                Áp dụng
            </Button>
        </div>
    );

    return (
        <div
            className="min-h-screen px-4 py-8"
        >
            <div className="mx-auto max-w-7xl">
                {/* Page Title */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Title level={2}>
                        Tất cả sản phẩm
                    </Title>
                </motion.div>

                {/* Filter Drawer - Mobile */}
                <Drawer
                    title={
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FilterOutlined />
                                <Text strong>Bộ lọc</Text>
                            </div>
                        </div>
                    }
                    placement="left"
                    onClose={() => setFilterDrawerOpen(false)}
                    open={filterDrawerOpen}
                    width={280}
                >
                    {/* Category Filter - Collapsible */}
                    <Collapse
                        defaultActiveKey={['category']}
                        ghost
                        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
                        items={[
                            {
                                key: 'category',
                                label: (
                                    <Text strong>
                                        <AppstoreOutlined className="mr-2" />
                                        Danh mục
                                    </Text>
                                ),
                                children: (
                                    <div
                                        className="space-y-1"
                                        style={{
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            paddingRight: '4px'
                                        }}
                                    >
                                        <Button
                                            type={!filters.categoryId ? "primary" : "text"}
                                            block
                                            onClick={() => handleCategoryChange(undefined)}
                                            className="text-left"
                                            size="small"
                                        >
                                            Tất cả danh mục
                                        </Button>
                                        {categories?.map((cat) => (
                                            <Button
                                                key={cat.id}
                                                type={filters.categoryId === cat.id ? "primary" : "text"}
                                                block
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className="text-left"
                                                title={cat.name}
                                                size="small"
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {cat.name}
                                            </Button>
                                        ))}
                                    </div>
                                ),
                            },
                        ]}
                    />
                    <Divider className="my-3" />
                    {/* Price Filter */}
                    <PriceFilterSection />
                </Drawer>

                {/* Main Content - Full Width */}
                <div className="w-full">
                    {/* Toolbar */}
                    <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Filter Button - Always visible */}
                            <Button
                                icon={<FilterOutlined />}
                                onClick={() => setFilterDrawerOpen(true)}
                            >
                                Bộ lọc
                            </Button>
                            <Divider type="vertical" />
                            <SortAscendingOutlined className="text-gray-500" />
                            <Text strong className="whitespace-nowrap">Sắp xếp:</Text>
                            <Select
                                value={getCurrentSortValue()}
                                onChange={handleSortChange}
                                style={{ minWidth: 150 }}
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

                        <Text type="secondary" className="whitespace-nowrap">
                            {isLoading ? "Đang tải..." : `${total} sản phẩm`}
                        </Text>
                    </div>

                    {/* Active Filter Tags */}
                    <ActiveFilterTags />

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
                            >
                                <div className="flex justify-center py-12">
                                    <Empty description="Không tìm thấy sản phẩm" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="products"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Row gutter={[16, 16]}>
                                    {products
                                        .filter(product => !product.isGift) // Hide gift products from main listing
                                        .map((product, index) => (
                                            <Col
                                                key={product.id}
                                                xs={12}
                                                sm={12}
                                                md={8}
                                                lg={6}
                                                xl={6}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{
                                                        delay: index * 0.05,
                                                        duration: 0.3,
                                                    }}
                                                >
                                                    <ProductCard product={product} activePromotions={activePromotions} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                </Row>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {!isLoading && products.length > 0 && (
                        <motion.div
                            className="mt-8 flex justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={size}
                                onChange={handlePageChange}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total, range) =>
                                    `${range[0]}-${range[1]} / ${total} sản phẩm`
                                }
                                pageSizeOptions={["12", "24", "36", "48"]}
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;
