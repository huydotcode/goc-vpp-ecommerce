(function () {
    document.addEventListener('DOMContentLoaded', function () {
        initHomeSections();
    });

    const sliderState = new Map();

    async function initHomeSections() {
        bindHeroSearch();
        bindSliderNavigation();
        await Promise.allSettled([
            loadCategoriesSection(),
            loadFlashSalesSection(),
            loadNewArrivalsSection(),
            loadFeaturedSection(),
            loadBrandShowcaseSection()
        ]);
    }

    function bindHeroSearch() {
        const form = document.getElementById('heroSearchForm');
        const cta = document.getElementById('heroCta');
        if (cta) {
            cta.setAttribute('href', buildShopUrl());
        }
        if (!form) return;
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const input = document.getElementById('heroSearchInput');
            const query = (input?.value || '').trim();
            window.location.href = buildShopUrl(query ? { search: query } : {});
        });
    }

    function bindSliderNavigation() {
        const buttons = document.querySelectorAll('.slider-nav');
        buttons.forEach((button) => {
            const targetId = button.dataset.target;
            const direction = button.dataset.direction === 'next' ? 1 : -1;
            if (!targetId) return;
            button.addEventListener('click', () => moveSlider(targetId, direction));
        });
    }

    function moveSlider(targetId, direction) {
        const track = document.getElementById(targetId);
        if (!track) return;
        const slider = track.closest('.product-slider');
        if (!slider) return;
        const step = slider.clientWidth || 320;
        const maxOffset = Math.max(0, track.scrollWidth - slider.clientWidth);
        const currentOffset = sliderState.get(targetId) || 0;
        let nextOffset = currentOffset + direction * step;
        if (nextOffset < 0) nextOffset = 0;
        if (nextOffset > maxOffset) nextOffset = maxOffset;
        sliderState.set(targetId, nextOffset);
        track.style.transform = `translateX(-${nextOffset}px)`;
    }

    function resetSliderPosition(targetId) {
        sliderState.set(targetId, 0);
        const track = document.getElementById(targetId);
        if (track) {
            track.style.transform = 'translateX(0)';
        }
    }

    function buildShopUrl(options = {}) {
        const params = new URLSearchParams({
            page: 1,
            size: 12,
            sort: 'createdAt',
            direction: 'DESC',
            isActive: true
        });
        if (options.search) params.set('search', options.search);
        if (options.categoryId) params.set('categoryId', options.categoryId);
        if (options.brand) params.set('brand', options.brand);
        if (options.isFeatured !== undefined && options.isFeatured !== null) {
            params.set('isFeatured', options.isFeatured);
        }
        return `/shop?${params.toString()}`;
    }

    function truncateText(text, maxLength = 90) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        const trimmed = text.trim();
        if (trimmed.length <= maxLength) {
            return trimmed;
        }
        return trimmed.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
    }

    function resolveBackendUrl() {
        if (typeof BACKEND_URL !== 'undefined' && BACKEND_URL) {
            return BACKEND_URL;
        }
        if (typeof window !== 'undefined' && window.BACKEND_URL) {
            return window.BACKEND_URL;
        }
        return 'http://localhost:8080/api/v1';
    }

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

    async function fetchApi(path, options = {}) {
        const baseUrl = resolveBackendUrl();
        const token = await resolveAuthToken();
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${baseUrl}${path}`, {
            method: 'GET',
            credentials: 'include',
            ...options,
            headers
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (payload && typeof payload === 'object' && Array.isArray(payload.data?.result)) {
            return payload.data;
        }
        if (payload && typeof payload === 'object' && Array.isArray(payload.result)) {
            return payload;
        }
        return payload?.data || payload || {};
    }

    function getSafeProducts(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.result)) return data.result;
        return [];
    }

    function formatCurrency(amount) {
        const number = Number(amount || 0);
        if (Number.isNaN(number)) {
            return '0 ₫';
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(number);
    }

    function formatPercent(value) {
        const number = Number(value || 0);
        if (Number.isNaN(number) || number <= 0) {
            return null;
        }
        return `${Math.round(number)}%`;
    }

    function buildProductUrl(id) {
        return `/shop/product/${id}`;
    }

    function hasValidDiscount(product) {
        if (!product) return false;
        const price = Number(product.price);
        const discount = Number(product.discountPrice);
        if (Number.isNaN(price) || Number.isNaN(discount)) return false;
        return discount > 0 && price > 0 && discount < price;
    }

    function getDiscountPercent(product) {
        if (!hasValidDiscount(product)) return 0;
        const price = Number(product.price);
        const discount = Number(product.discountPrice);
        return Math.round(((price - discount) / price) * 100);
    }

    function renderProductCard(product, options = {}) {
        const {
            compact = false,
            showDescription = true
        } = options;

        const cardClasses = ['product-card'];
        if (compact) {
            cardClasses.push('product-card--compact');
        }

        const hasDiscount = hasValidDiscount(product);
        const discountPercent = hasDiscount ? getDiscountPercent(product) : 0;
        const discountLabel = hasDiscount ? `-${discountPercent}%` : null;
        const priceValue = product && (product.discountPrice || product.price);
        const priceText = priceValue ? formatCurrency(priceValue) : 'Liên hệ';
        const oldPriceText = hasDiscount ? formatCurrency(product.price) : '';
        const descriptionText = showDescription
            ? truncateText(product?.description, 90) || 'Thông tin sản phẩm đang được cập nhật.'
            : '';

        const imageUrl = product?.thumbnailUrl || '/image/placeholder.png';
        const imageAlt = escapeAttribute(product?.name || 'Product');
        
        return `
            <div class="${cardClasses.join(' ')}" onclick="handleHomeCardNavigate(event, ${product.id})">
                <div class="product-image-wrapper">
                    <img 
                        src="${escapeAttribute(imageUrl)}" 
                        alt="${imageAlt}" 
                        class="product-image" 
                        loading="lazy" 
                        decoding="async" 
                        width="260" 
                        height="260"
                        fetchpriority="low"
                        style="aspect-ratio: 1 / 1; object-fit: cover;"
                    />
                    ${discountLabel ? `<div class="product-badge"><i class="fas fa-tag"></i> <span>${discountLabel}</span></div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-brand">${escapeHtml(product?.brand || 'Thương hiệu')}</div>
                    <h3 class="product-name">${escapeHtml(product?.name || 'Sản phẩm')}</h3>
                    ${showDescription ? `<p class="product-description">${escapeHtml(descriptionText)}</p>` : ''}
                    <div class="product-price-section">
                        <span class="product-price">${escapeHtml(priceText)}</span>
                        ${hasDiscount ? `<span class="product-price-old">${escapeHtml(oldPriceText)}</span>` : ''}
                        ${discountLabel ? `<span class="product-discount">${discountLabel}</span>` : ''}
                    </div>
                </div>
                <div class="product-card-actions">
                    <button type="button" class="btn-add-to-cart" onclick="handleHomeAddToCart(event, ${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        `;
    }

    async function loadCategoriesSection() {
        const grid = document.getElementById('categoriesGrid');
        const section = document.getElementById('categoriesSection');
        if (!grid) return;
        try {
            const payload = await fetchApi('/categories/advanced?page=1&size=12&sort=updatedAt&direction=desc&isActive=true');
            const categories = getSafeProducts(payload).slice(0, 8);
            if (!categories.length) {
                if (section) section.style.display = 'none';
                return;
            }
            grid.innerHTML = categories.map(cat => {
                const name = (cat?.name || 'Danh mục').trim();
                const image = cat?.thumbnailUrl;
                const link = buildShopUrl({ categoryId: cat?.id });
                const hasImage = image && image.trim() && image !== '/image/placeholder.png';
                const thumbContent = hasImage
                    ? `<img 
                        src="${escapeAttribute(image)}" 
                        alt="${escapeAttribute(name)}" 
                        loading="lazy" 
                        decoding="async" 
                        width="88" 
                        height="88"
                        fetchpriority="low"
                        style="aspect-ratio: 1 / 1; object-fit: cover;"
                    />`
                    : `<i class="fas fa-folder"></i>`;
                const thumbClass = hasImage ? 'category-thumb' : 'category-thumb-placeholder';
                return `
                    <a href="${link}" class="category-card">
                        <div class="${thumbClass}">
                            ${thumbContent}
                        </div>
                        <span class="category-name">${escapeHtml(name)}</span>
                    </a>
                `;
            }).join('');
        } catch (error) {
            console.warn('Không thể tải danh mục:', error);
        }
    }

    async function loadFlashSalesSection() {
        const trackId = 'flashSalesTrack';
        const track = document.getElementById(trackId);
        const section = document.getElementById('flashSalesSection');
        if (!track || !section) return;
        try {
            const payload = await fetchApi('/products/advanced?page=1&size=24&sort=updatedAt&direction=DESC&isActive=true');
            const products = getSafeProducts(payload)
                .filter(p => hasValidDiscount(p))
                .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
                .slice(0, 10);
            if (!products.length) {
                section.style.display = 'none';
                return;
            }
            resetSliderPosition(trackId);
            track.innerHTML = products.map(product => `
                <div class="product-slide">
                    ${renderProductCard(product, { compact: true, showDescription: false })}
                </div>
            `).join('');
        } catch (error) {
            console.warn('Không thể tải flash sales:', error);
            section.style.display = 'none';
        }
    }

    async function loadNewArrivalsSection() {
        const trackId = 'newArrivalsTrack';
        const track = document.getElementById(trackId);
        const section = document.getElementById('newArrivalsSection');
        if (!track || !section) return;
        try {
            const payload = await fetchApi('/products/advanced?page=1&size=16&sort=createdAt&direction=DESC&isActive=true');
            const products = getSafeProducts(payload).slice(0, 10);
            if (!products.length) {
                section.style.display = 'none';
                return;
            }
            resetSliderPosition(trackId);
            track.innerHTML = products.map(product => `
                <div class="product-slide">
                    ${renderProductCard(product, { compact: true, showDescription: false })}
                </div>
            `).join('');
        } catch (error) {
            console.warn('Không thể tải New Arrival:', error);
            section.style.display = 'none';
        }
    }

    async function loadFeaturedSection() {
        const trackId = 'featuredTrack';
        const track = document.getElementById(trackId);
        const section = document.getElementById('featuredSection');
        if (!track || !section) return;
        try {
            const payload = await fetchApi('/products/advanced?page=1&size=16&sort=updatedAt&direction=DESC&isFeatured=true&isActive=true');
            const products = getSafeProducts(payload).slice(0, 10);
            if (!products.length) {
                section.style.display = 'none';
                return;
            }
            resetSliderPosition(trackId);
            track.innerHTML = products.map(product => `
                <div class="product-slide">
                    ${renderProductCard(product, { compact: true, showDescription: false })}
                </div>
            `).join('');
        } catch (error) {
            console.warn('Không thể tải sản phẩm nổi bật:', error);
            section.style.display = 'none';
        }
    }

    async function loadBrandShowcaseSection() {
        const section = document.getElementById('brandShowcaseSection');
        if (!section) return;
        const brand = section.dataset.brand;
        const trackId = 'brandHighlightTrack';
        const track = document.getElementById(trackId);
        if (!track || !brand) {
            section.style.display = 'none';
            return;
        }
        try {
            const encodedBrand = encodeURIComponent(brand);
            const payload = await fetchApi(`/products/advanced?page=1&size=16&sort=updatedAt&direction=DESC&brand=${encodedBrand}&isActive=true`);
            const products = getSafeProducts(payload).slice(0, 10);
            if (!products.length) {
                section.style.display = 'none';
                return;
            }
            resetSliderPosition(trackId);
            track.innerHTML = products.map(product => `
                <div class="product-slide">
                    ${renderProductCard(product, { compact: true, showDescription: false })}
                </div>
            `).join('');
        } catch (error) {
            console.warn('Không thể tải thương hiệu nổi bật:', error);
            section.style.display = 'none';
        }
    }

    window.handleHomeAddToCart = function (event, productId) {
        event.stopPropagation();
        try {
            addCartItem(productId, 1);
            updateCartBadge && updateCartBadge();
            showNotification && showNotification('Đã thêm sản phẩm vào giỏ hàng.', 'success');
        } catch (error) {
            console.error('Failed to add product to cart', error);
            showNotification && showNotification('Không thể thêm sản phẩm vào giỏ hàng.', 'error');
        }
    };

    window.handleHomeCardNavigate = function (event, productId) {
        const isAction = event.target.closest('.btn-add-to-cart');
        if (isAction) {
            return;
        }
        window.location.href = buildProductUrl(productId);
    };

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/"/g, '&quot;');
    }
})();
