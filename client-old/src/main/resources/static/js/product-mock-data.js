/**
 * Product Mock Data - 10 sample products for testing
 * Usage: fillProductForm(mockProducts[0]) to fill form with first product
 */

const mockProducts = [
    {
        name: "Bút bi Thiên Long TL-027",
        sku: "TL-027-001",
        price: 5000,
        discountPrice: 4000,
        stockQuantity: 500,
        brand: "Thiên Long",
        color: "Xanh dương",
        size: "0.7mm",
        weight: "5g",
        dimensions: "14cm x 1cm",
        specifications: "Bút bi nước, mực xanh, đầu bi 0.7mm",
        description: "Bút bi chất lượng cao từ Thiên Long, viết mượt mà, không lem mực. Phù hợp cho học sinh, sinh viên và nhân viên văn phòng.",
        thumbnailUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
        categories: [1, 2], // Category IDs - adjust based on your actual categories
        isActive: true,
        isFeatured: true
    },
    {
        name: "Vở học sinh 200 trang",
        sku: "VH-200-001",
        price: 15000,
        discountPrice: 12000,
        stockQuantity: 300,
        brand: "Campus",
        color: "Trắng",
        size: "A5",
        weight: "200g",
        dimensions: "21cm x 14.8cm",
        specifications: "200 trang, giấy trắng 70gsm, bìa cứng",
        description: "Vở học sinh chất lượng cao với 200 trang giấy trắng, bìa cứng bền đẹp. Phù hợp cho học sinh tiểu học và trung học.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
        categories: [2, 3],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Bút chì 2B Staedtler",
        sku: "ST-2B-001",
        price: 8000,
        discountPrice: null,
        stockQuantity: 1000,
        brand: "Staedtler",
        color: "Vàng",
        size: "2B",
        weight: "3g",
        dimensions: "17.5cm",
        specifications: "Bút chì 2B, gỗ cao cấp, không gãy khi rơi",
        description: "Bút chì 2B chất lượng cao từ Staedtler, mềm mại dễ tẩy, phù hợp cho vẽ và viết.",
        thumbnailUrl: "https://images.unsplash.com/photo-1606326608606-aa0b5ea00193?w=400",
        categories: [1],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Tẩy bút chì Pentel",
        sku: "PN-ER-001",
        price: 12000,
        discountPrice: 10000,
        stockQuantity: 800,
        brand: "Pentel",
        color: "Trắng",
        size: "Nhỏ",
        weight: "5g",
        dimensions: "5cm x 2cm x 1cm",
        specifications: "Tẩy cao su, không làm bẩn giấy, tẩy sạch",
        description: "Tẩy bút chì chất lượng cao, tẩy sạch không để lại vết bẩn trên giấy.",
        thumbnailUrl: "https://images.unsplash.com/photo-1606326608606-aa0b5ea00193?w=400",
        categories: [1],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Thước kẻ 30cm",
        sku: "TK-30-001",
        price: 10000,
        discountPrice: 8000,
        stockQuantity: 600,
        brand: "Faber-Castell",
        color: "Trong suốt",
        size: "30cm",
        weight: "10g",
        dimensions: "30cm x 3cm",
        specifications: "Thước nhựa trong suốt, vạch chia rõ ràng, chống trầy",
        description: "Thước kẻ 30cm chất lượng cao, trong suốt, vạch chia chính xác, bền đẹp.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
        categories: [1, 2],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Compa vẽ tròn",
        sku: "CP-001",
        price: 25000,
        discountPrice: 20000,
        stockQuantity: 200,
        brand: "Faber-Castell",
        color: "Bạc",
        size: "Tiêu chuẩn",
        weight: "15g",
        dimensions: "15cm",
        specifications: "Compa kim loại, có bút chì kèm theo, vẽ tròn chính xác",
        description: "Compa vẽ tròn chất lượng cao, kim loại bền chắc, phù hợp cho học sinh và sinh viên.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
        categories: [1, 2],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Bút highlight Stabilo",
        sku: "ST-HL-001",
        price: 15000,
        discountPrice: 12000,
        stockQuantity: 400,
        brand: "Stabilo",
        color: "Vàng",
        size: "Nhỏ",
        weight: "8g",
        dimensions: "14cm",
        specifications: "Bút highlight màu vàng, mực không lem, khô nhanh",
        description: "Bút highlight chất lượng cao, màu sắc tươi sáng, không làm lem mực, khô nhanh.",
        thumbnailUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
        categories: [1],
        isActive: true,
        isFeatured: true
    },
    {
        name: "Bút máy Pilot",
        sku: "PL-FP-001",
        price: 150000,
        discountPrice: 120000,
        stockQuantity: 50,
        brand: "Pilot",
        color: "Đen",
        size: "Tiêu chuẩn",
        weight: "20g",
        dimensions: "14cm x 1.2cm",
        specifications: "Bút máy cao cấp, ngòi mực, hộp mực kèm theo",
        description: "Bút máy cao cấp từ Pilot, thiết kế sang trọng, viết mượt mà, phù hợp cho văn phòng và quà tặng.",
        thumbnailUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
        categories: [1],
        isActive: true,
        isFeatured: true
    },
    {
        name: "Bìa kẹp hồ sơ A4",
        sku: "BK-A4-001",
        price: 20000,
        discountPrice: 15000,
        stockQuantity: 250,
        brand: "Kangaro",
        color: "Xanh",
        size: "A4",
        weight: "50g",
        dimensions: "30cm x 22cm",
        specifications: "Bìa kẹp hồ sơ A4, bìa cứng, có khóa kẹp",
        description: "Bìa kẹp hồ sơ A4 chất lượng cao, bìa cứng bền đẹp, có khóa kẹp chắc chắn.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
        categories: [2, 3],
        isActive: true,
        isFeatured: false
    },
    {
        name: "Giấy note dán 3M",
        sku: "GN-3M-001",
        price: 30000,
        discountPrice: 25000,
        stockQuantity: 150,
        brand: "3M",
        color: "Vàng",
        size: "76mm x 76mm",
        weight: "30g",
        dimensions: "76mm x 76mm",
        specifications: "Giấy note dán, 100 tờ, màu vàng, keo dán chắc",
        description: "Giấy note dán 3M chất lượng cao, keo dán chắc chắn, dễ viết, phù hợp cho văn phòng.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
        categories: [2, 3],
        isActive: true,
        isFeatured: false
    }
];

/**
 * Fill product form with mock data
 * @param {Object} productData - Product data object
 */
function fillProductForm(productData) {
    if (!productData) {
        console.error('Product data is required');
        return;
    }

    // Fill basic fields
    const nameInput = document.getElementById('createName');
    if (nameInput) nameInput.value = productData.name || '';

    const skuInput = document.getElementById('createSku');
    if (skuInput) skuInput.value = productData.sku || '';

    const priceInput = document.getElementById('createPrice');
    if (priceInput) priceInput.value = productData.price || '';

    const discountPriceInput = document.getElementById('createDiscountPrice');
    if (discountPriceInput) discountPriceInput.value = productData.discountPrice || '';

    const stockInput = document.getElementById('createStock');
    if (stockInput) stockInput.value = productData.stockQuantity || '';

    const brandInput = document.getElementById('createBrand');
    if (brandInput) brandInput.value = productData.brand || '';

    const colorInput = document.getElementById('createColor');
    if (colorInput) colorInput.value = productData.color || '';

    const sizeInput = document.getElementById('createSize');
    if (sizeInput) sizeInput.value = productData.size || '';

    const weightInput = document.getElementById('createWeight');
    if (weightInput) weightInput.value = productData.weight || '';

    const dimensionsInput = document.getElementById('createDimensions');
    if (dimensionsInput) dimensionsInput.value = productData.dimensions || '';

    const specificationsInput = document.getElementById('createSpecifications');
    if (specificationsInput) specificationsInput.value = productData.specifications || '';

    const descriptionInput = document.getElementById('createDescription');
    if (descriptionInput) descriptionInput.value = productData.description || '';

    const thumbnailInput = document.getElementById('createThumbnailUrl');
    if (thumbnailInput) thumbnailInput.value = productData.thumbnailUrl || '';

    // Fill checkboxes
    const isActiveCheckbox = document.getElementById('createIsActive');
    if (isActiveCheckbox) isActiveCheckbox.checked = productData.isActive !== false;

    const isFeaturedCheckbox = document.getElementById('createIsFeatured');
    if (isFeaturedCheckbox) isFeaturedCheckbox.checked = productData.isFeatured === true;

    // Fill categories (if multiselect is available)
    if (productData.categories && Array.isArray(productData.categories) && productData.categories.length > 0) {
        // Wait a bit for categories to load, then select them
        setTimeout(() => {
            // Use populateCategoriesMultiselect if available
            if (typeof populateCategoriesMultiselect === 'function') {
                populateCategoriesMultiselect('createCategoriesWrapper', productData.categories);
            } else {
                // Fallback: manually set hidden input
                const categoriesHidden = document.getElementById('createCategories');
                if (categoriesHidden) {
                    const categoriesData = productData.categories.map(id => ({ id: id }));
                    categoriesHidden.value = JSON.stringify(categoriesData);
                }
            }
        }, 800);
    }

    console.log('Form filled with product data:', productData);
    showNotification('Đã điền form với dữ liệu mẫu!', 'success');
}

/**
 * Fill form with random mock product
 */
function fillRandomProduct() {
    const randomIndex = Math.floor(Math.random() * mockProducts.length);
    fillProductForm(mockProducts[randomIndex]);
}

/**
 * Fill form with product by index (0-9)
 */
function fillProductByIndex(index) {
    if (index >= 0 && index < mockProducts.length) {
        fillProductForm(mockProducts[index]);
    } else {
        console.error('Invalid index. Must be between 0 and ' + (mockProducts.length - 1));
    }
}

// Expose functions globally
window.mockProducts = mockProducts;
window.fillProductForm = fillProductForm;
window.fillRandomProduct = fillRandomProduct;
window.fillProductByIndex = fillProductByIndex;

