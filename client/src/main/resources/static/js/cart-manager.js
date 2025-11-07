/**
 * Cart Manager - Handle all cart operations
 */

const __cartProductCache = new Map();
let cartRenderVersion = 0;
let activePromotions = [];

function resolveBackendUrl() {
    if (typeof BACKEND_URL !== 'undefined' && BACKEND_URL) {
        return BACKEND_URL;
    }
    if (typeof window !== 'undefined' && window.BACKEND_URL) {
        return window.BACKEND_URL;
    }
    return 'http://localhost:8080/api/v1';
}

const __cartBackendUrl = resolveBackendUrl();

async function resolveAuthToken() {
    if (typeof getToken === 'function') {
        try {
            return await getToken();
        } catch (err) {
            console.warn('Failed to retrieve token via getToken()', err);
        }
    }
    try {
        return localStorage.getItem('access_token');
    } catch (err) {
        return null;
    }
}

// Update cart badge display
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const quantity = getCartQuantity();
        badge.textContent = quantity;
        badge.style.display = quantity > 0 ? 'flex' : 'none';
    }
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
}

function toNullableNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}

// Get product details from cart (will be populated when showing cart page)
async function getProductDetails(productId) {
    const cacheKey = String(productId);
    if (__cartProductCache.has(cacheKey)) {
        return __cartProductCache.get(cacheKey);
    }
    try {
        const token = await resolveAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${__cartBackendUrl}/products/${productId}`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });
        
        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        const product = payload && typeof payload === 'object' && payload.data !== undefined
            ? payload.data
            : payload;

        if (product && typeof product === 'object') {
            __cartProductCache.set(cacheKey, product);
            return product;
        }
        return null;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
}

// Format Vietnamese currency
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Display cart items on the cart page
async function displayCartItems() {
    const currentVersion = ++cartRenderVersion;
    const cartItems = getCartItems();
    const cartContainer = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCartState');
    const clearBtn = document.getElementById('clearCartBtn');
    
    if (!cartContainer) return;
    
    if (cartItems.length === 0) {
        cartContainer.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        if (clearBtn) clearBtn.style.display = 'none';
        updateCartSummary(0, 0, 0, 0);
        return;
    }
    
    if (clearBtn) clearBtn.style.display = 'block';
    if (emptyCart) emptyCart.style.display = 'none';
    cartContainer.style.display = 'block';

    const productPromises = cartItems.map(item => getProductDetails(item.productID));
    const products = await Promise.all(productPromises);

    if (currentVersion !== cartRenderVersion) {
        return;
    }

    cartContainer.innerHTML = '';

    let subtotalBeforeDiscount = 0;
    let discountedSubtotal = 0;
    let totalSavings = 0;
    let totalQuantity = 0;

    products.forEach((product, index) => {
        const cartItem = cartItems[index];
        if (!product || !cartItem) {
            return;
        }

        const rawBasePrice = toNullableNumber(product.price);
        const rawDiscountPrice = toNullableNumber(product.discountPrice);

        const referencePrice = rawBasePrice !== null && rawBasePrice > 0
            ? rawBasePrice
            : (rawDiscountPrice !== null && rawDiscountPrice > 0 ? rawDiscountPrice : 0);

        const effectivePrice = rawDiscountPrice !== null && rawDiscountPrice > 0
            && (rawBasePrice === null || rawBasePrice === 0 || rawDiscountPrice < rawBasePrice)
            ? rawDiscountPrice
            : referencePrice;

        const baseTotal = referencePrice * cartItem.quantity;
        const discountedTotal = effectivePrice * cartItem.quantity;

        subtotalBeforeDiscount += baseTotal;
        discountedSubtotal += discountedTotal;
        totalSavings += Math.max(referencePrice - effectivePrice, 0) * cartItem.quantity;
        totalQuantity += cartItem.quantity;

        const cartItemElement = createCartItemElement(product, cartItem, effectivePrice, referencePrice, discountedTotal);
        cartContainer.appendChild(cartItemElement);
    });

    const promotionResult = calculatePromotionDiscount(cartItems, products);
    const promotionDiscount = promotionResult.discount;
    const finalTotal = Math.max(discountedSubtotal - promotionDiscount, 0);

    updateCartSummary(totalQuantity, subtotalBeforeDiscount, totalSavings + promotionDiscount, finalTotal);
    updatePromotionSummary(promotionResult);
}

// Create cart item HTML element
function createCartItemElement(product, cartItem, effectivePrice, referencePrice, itemTotal) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.productId = product.id;
    
    const imageUrl = product.thumbnailUrl || '/image/placeholder.png';
    
    div.innerHTML = `
        <div class="cart-item-image">
            <img src="${imageUrl}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2214%22%3ENo Image%3C/text%3E%3C/svg%3E'" />
        </div>
        <div class="cart-item-details">
            <div class="cart-item-header">
                <h3 class="cart-item-name">${product.name}</h3>
                <button class="cart-item-remove-btn" onclick="removeFromCart('${product.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <p class="cart-item-brand">${product.brand || 'N/A'}</p>
            <div class="cart-item-info">
                <span class="cart-item-price">${formatVND(effectivePrice)}</span>
                ${referencePrice > effectivePrice ? `<span class="cart-item-price-old">${formatVND(referencePrice)}</span>` : ''}
                <div class="cart-item-quantity">
                    <button class="qty-btn qty-minus" onclick="updateQuantity('${product.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input 
                        type="number" 
                        class="qty-input" 
                        value="${cartItem.quantity}" 
                        min="1" 
                        max="999"
                        onchange="handleQuantityChange('${product.id}', this.value)"
                    />
                    <button class="qty-btn qty-plus" onclick="updateQuantity('${product.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="cart-item-total">
            <div class="cart-item-total-price">${formatVND(itemTotal)}</div>
        </div>
    `;
    
    return div;
}

function buildCartItemKey(productId) {
    return String(productId);
}

function calculatePromotionDiscount(cartItems, products) {
    if (!Array.isArray(activePromotions) || activePromotions.length === 0) {
        return { discount: 0, applied: [] };
    }

    const productMap = new Map();
    cartItems.forEach((item, index) => {
        const product = products[index];
        if (product) {
            const key = buildCartItemKey(item.productID);
            productMap.set(key, {
                product,
                quantity: item.quantity
            });
        }
    });

    let totalPromotionDiscount = 0;
    const appliedPromotions = [];

    activePromotions.forEach((promotion) => {
        if (!promotion || promotion.isActive === false) {
            return;
        }

        const result = evaluateDiscountPromotion(promotion, productMap);
        if (result.timesApplied > 0) {
            const discountValue = result.discountAmount * result.timesApplied;
            if (discountValue > 0) {
                totalPromotionDiscount += discountValue;
                appliedPromotions.push({
                    name: promotion.name || 'Unnamed promotion',
                    amount: discountValue,
                    details: result.details
                });
            }
        }

        if (promotion.discountType === 'GIFT' && result.timesApplied > 0) {
            appliedPromotions.push({
                name: promotion.name || 'Gift promotion',
                amount: 0,
                note: 'Tặng quà'
            });
        }
    });

    return {
        discount: totalPromotionDiscount,
        applied: appliedPromotions
    };
}

function evaluateDiscountPromotion(promotion, productMap) {
    if (promotion.discountType !== 'DISCOUNT_AMOUNT') {
        return { timesApplied: 0, discountAmount: 0, details: [] };
    }

    let timesApplied = Infinity;
    const detailList = [];

    if (!Array.isArray(promotion.conditions) || promotion.conditions.length === 0) {
        promotion.conditions = [];
    }

    promotion.conditions.forEach((condition) => {
        if (!condition || !Array.isArray(condition.details) || condition.details.length === 0) {
            return;
        }

        condition.details.forEach((detail) => {
            const item = productMap.get(buildCartItemKey(detail.productId));
            if (!item || !detail.requiredQuantity) {
                timesApplied = 0;
                return;
            }
            const applicable = Math.floor(item.quantity / detail.requiredQuantity);
            timesApplied = Math.min(timesApplied, applicable);
            detailList.push({
                productName: detail.productName,
                requiredQuantity: detail.requiredQuantity,
                productPrice: detail.productPrice
            });
        });
    });

    if (timesApplied === Infinity) {
        timesApplied = 0;
    }

    const discountAmount = toNumber(promotion.discountAmount);
    return {
        timesApplied,
        discountAmount,
        details: detailList
    };
}

function updatePromotionSummary(promotionResult) {
    const row = document.getElementById('promotionRow');
    const totalEl = document.getElementById('promotionTotal');
    const listEl = document.getElementById('promotionList');

    if (!row || !totalEl || !listEl) {
        return;
    }

    if (!promotionResult || !Array.isArray(promotionResult.applied) || promotionResult.applied.length === 0) {
        row.style.display = 'none';
        listEl.innerHTML = '';
        return;
    }

    row.style.display = 'flex';
    totalEl.textContent = `- ${formatVND(promotionResult.discount)}`;
    listEl.innerHTML = promotionResult.applied
        .map(item => {
            const base = `${item.name}${item.amount ? ` (${formatVND(item.amount)})` : ''}${item.note ? ` - ${item.note}` : ''}`;
            if (item.details && item.details.length > 0) {
                const detailLines = item.details
                    .map(detail => `+ ${detail.productName || 'Sản phẩm'} × ${detail.requiredQuantity}`)
                    .join('<br/>');
                return `<div>${base}<div class="promotion-detail-list">${detailLines}</div></div>`;
            }
            return `<div>${base}</div>`;
        })
        .join('');
}

// Remove item from cart
function removeFromCart(productId) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        removeCartItem(productId);
        updateCartBadge();
        displayCartItems();
        showNotification('Sản phẩm đã được xóa khỏi giỏ hàng', 'success');
    }
}

// Update quantity
function updateQuantity(productId, change) {
    const cartItems = getCartItems();
    const item = cartItems.find(i => i.productID === String(productId));
    
    if (item) {
        const newQuantity = Math.max(1, item.quantity + change);
        updateCartItem(productId, newQuantity);
        updateCartBadge();
        displayCartItems();
    }
}

// Handle quantity change from input
function handleQuantityChange(productId, value) {
    let quantity = parseInt(value, 10);
    
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }
    if (quantity > 999) {
        quantity = 999;
    }
    
    updateCartItem(productId, quantity);
    updateCartBadge();
    displayCartItems();
}

// Update cart summary
function updateCartSummary(totalQuantity, subtotalBeforeDiscount, savings, totalAfterDiscount) {
    const countEl = document.getElementById('cartItemCount');
    const subtotalEl = document.getElementById('cartSubtotal');
    const savingsEl = document.getElementById('cartSavings');
    const totalEl = document.getElementById('cartTotal');
    
    if (countEl) countEl.textContent = totalQuantity;
    if (subtotalEl) subtotalEl.textContent = formatVND(subtotalBeforeDiscount);
    if (savingsEl) savingsEl.textContent = formatVND(savings);
    if (totalEl) totalEl.textContent = formatVND(totalAfterDiscount);
}

// Clear entire cart
function clearEntireCart() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
        clearCart();
        updateCartBadge();
        displayCartItems();
        showNotification('Giỏ hàng đã được xóa', 'success');
    }
}

// Checkout function (can be extended later with payment integration)
function proceedToCheckout() {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        showNotification('Giỏ hàng trống, không thể thanh toán', 'warning');
        return;
    }
    
    showNotification('Chức năng thanh toán sẽ được phát triển sớm', 'info');
    // TODO: Implement checkout flow
}

// Continue shopping
function continueShopping() {
    window.location.href = '/shop';
}

async function loadActivePromotions() {
    try {
        const token = await resolveAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${__cartBackendUrl}/promotions/active`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            console.warn('Failed to load promotions, status:', response.status);
            activePromotions = [];
            return activePromotions;
        }

        const payload = await response.json();
        if (payload && payload.status === 'success' && Array.isArray(payload.data)) {
            activePromotions = payload.data;
        } else if (Array.isArray(payload)) {
            activePromotions = payload;
        } else {
            activePromotions = [];
        }
    } catch (error) {
        console.error('Error loading promotions:', error);
        activePromotions = [];
    }
    return activePromotions;
}

if (typeof window !== 'undefined') {
    window.loadActivePromotions = loadActivePromotions;
    window.getActivePromotions = function () {
        return Array.isArray(activePromotions) ? activePromotions.slice() : [];
    };
}
