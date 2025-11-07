/**
 * Common Utilities Library - Shared functions for Users and Categories management
 */

// ==================== MODAL & DRAWER MANAGEMENT ====================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Optional: DO NOT close modal when clicking outside if data-static=true
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList && target.classList.contains('modal')) {
        if (target.getAttribute('data-static') === 'true') {
            // ignore outside click
            return;
        }
        closeModal(target.id);
    }
});

// ==================== LOADING OVERLAYS ====================

function showContainerLoading(text = 'Đang tải...') {
    const overlay = document.getElementById('containerLoadingOverlay');
    const textElement = overlay ? overlay.querySelector('.container-loading-text') : null;
    if (overlay) {
        if (textElement) textElement.textContent = text;
        overlay.classList.add('show');
    }
}

function hideContainerLoading() {
    const overlay = document.getElementById('containerLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function showTableLoading() {
    const overlay = document.getElementById('tableLoadingOverlay');
    if (overlay) {
        overlay.innerHTML = buildTableSkeletonHTML();
        overlay.style.display = 'flex';
    }
}

function hideTableLoading() {
    const overlay = document.getElementById('tableLoadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
    }
}

function buildTableSkeletonHTML(rows = 5, cols) {
    if (!cols) {
        const ths = document.querySelectorAll('table thead th');
        cols = ths && ths.length > 0 ? ths.length : 6;
    }
    let cells = '';
    for (let r = 0; r < rows; r++) {
        let row = '<tr>';
        for (let c = 0; c < cols; c++) {
            row += '<td><div class="skeleton skeleton-text"></div></td>';
        }
        row += '</tr>';
        cells += row;
    }
    return '<div style="width:100%;"><table class="table"><tbody>' + cells + '</tbody></table></div>';
}

// Form skeleton helpers
function showFormSkeleton(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    let skel = modal.querySelector('.form-skeleton');
    if (!skel) {
        skel = document.createElement('div');
        skel.className = 'form-skeleton';
        skel.innerHTML = `
            <div class="skeleton skeleton-text" style="width:40%"></div>
            <div class="skeleton skeleton-input"></div>
            <div class="skeleton skeleton-text" style="width:30%;margin-top:12px"></div>
            <div class="skeleton skeleton-input"></div>
            <div style="margin-top:16px"><span class="skeleton skeleton-btn"></span></div>
        `;
        const body = modal.querySelector('.modal-body') || modal;
        body.prepend(skel);
    }
    skel.classList.toggle('show', show);
    const form = modal.querySelector('form');
    if (form) form.style.display = show ? 'none' : '';
}

// ==================== NOTIFICATIONS ====================

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        hideNotification(notification);
    }, 3000);
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function initClientHeaderNav() {
    const navLinks = document.querySelectorAll('.client-nav a[data-nav]');
    if (!navLinks || navLinks.length === 0) {
        return;
    }

    const path = window.location.pathname.toLowerCase();
    const query = window.location.search.toLowerCase();
    let activeKey = 'home';

    if (path.startsWith('/client/home') || path === '/' || path === '') {
        activeKey = 'home';
    } else if (path.includes('/user')) {
        activeKey = 'account';
    } else if (query.includes('promo') || path.includes('/promotion')) {
        activeKey = 'promotion';
    } else if (query.includes('view=categories') || path.includes('/category')) {
        activeKey = 'categories';
    } else if (path.includes('/shop')) {
        activeKey = 'products';
    }

    navLinks.forEach(link => {
        if (link.dataset.nav === activeKey) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ==================== PAGINATION & FILTERING ====================

function changePageSize() {
    showContainerLoading('Đang thay đổi kích thước trang...');
    const pageSize = document.getElementById('pageSize')?.value;
    if (!pageSize) return;
    
    const url = new URL(window.location);
    url.searchParams.set('size', pageSize);
    url.searchParams.set('page', '0');
    window.location.href = url.toString();
}

function goToPageWithLoading(pageUrl) {
    showContainerLoading('Đang chuyển trang...');
    window.location.href = pageUrl;
}

// ==================== IMAGE UPLOAD & PREVIEW ====================

// Drag and drop setup
function setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area, .inline-upload-area');
    
    uploadAreas.forEach(area => {
        const fileInput = area.querySelector('.upload-area-file-input');
        if (!fileInput) return;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.remove('drag-over'), false);
        });
        
        // Handle dropped files
        area.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                fileInput.files = files;
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        }, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Image preview before upload
function previewImageBeforeUpload(file, container) {
    if (!file || !container) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const url = e.target.result;
        
        let previewContainer = container;
        if (!previewContainer.classList.contains('upload-preview-container')) {
            previewContainer = container.querySelector('.upload-preview-container') || container;
        }
        
        previewContainer.innerHTML = `
            <div style="position: relative; display: inline-block; width: 100%; max-width: 300px;">
                <img src="${url}" class="upload-preview-image" alt="Preview" />
                <button type="button" class="upload-preview-remove" onclick="removeImagePreview(this)">&times;</button>
            </div>
        `;
        previewContainer.classList.add('show');
        
        // Hide upload area
        const uploadArea = container.closest('.form-group')?.querySelector('.upload-area, .inline-upload-area');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        showNotification('Lỗi khi đọc file', 'error');
    };
    
    reader.readAsDataURL(file);
}

function removeImagePreview(button) {
    const previewContainer = button.closest('.upload-preview-container') || button.closest('[style*="position"]')?.parentElement;
    const uploadArea = previewContainer?.closest('.form-group')?.querySelector('.upload-area, .inline-upload-area');
    
    if (previewContainer) {
        previewContainer.innerHTML = '';
        previewContainer.classList.remove('show');
    }
    
    // Reset file input
    const fileInput = previewContainer?.closest('.form-group')?.querySelector('.upload-area-file-input, .inline-upload-area .upload-area-file-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Show upload area again
    if (uploadArea) {
        uploadArea.style.display = '';
    }
}

// Image preview modal
function showImagePreview(imageUrl) {
    if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null' || imageUrl === '' || imageUrl.includes('data:')) {
        console.warn('Invalid image URL:', imageUrl);
        showNotification('URL hình ảnh không hợp lệ', 'error');
        return;
    }
    
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('previewImage');
    
    if (!modal || !img) {
        console.error('Preview modal or image element not found');
        showNotification('Không tìm thấy modal preview', 'error');
        return;
    }
    
    img.onerror = () => {
        console.error('Failed to load image:', imageUrl);
        showNotification('Không thể tải hình ảnh', 'error');
        closeImagePreview();
    };
    
    img.src = imageUrl;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeImagePreview() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Close preview modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('imagePreviewModal');
    if (modal && e.target === modal) {
        closeImagePreview();
    }
});

// Close preview modal with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImagePreview();
    }
});

// Lightbox: navigate gallery with ArrowLeft/ArrowRight
let __galleryImages = [];
let __galleryIndex = -1;
function initGalleryFromContainer(containerId, currentUrl) {
    __galleryImages = [];
    __galleryIndex = -1;
    const cont = document.getElementById(containerId);
    if (!cont) return;
    const imgs = cont.querySelectorAll('img');
    imgs.forEach((img, idx) => {
        const url = img.getAttribute('data-image-url') || img.src;
        __galleryImages.push(url);
        if (url === currentUrl) __galleryIndex = idx;
    });
}
document.addEventListener('keydown', function(e) {
    if (!document.getElementById('imagePreviewModal')?.classList.contains('show')) return;
    if (__galleryImages.length === 0 || __galleryIndex < 0) return;
    if (e.key === 'ArrowRight') {
        __galleryIndex = (__galleryIndex + 1) % __galleryImages.length;
        document.getElementById('previewImage').src = __galleryImages[__galleryIndex];
    } else if (e.key === 'ArrowLeft') {
        __galleryIndex = (__galleryIndex - 1 + __galleryImages.length) % __galleryImages.length;
        document.getElementById('previewImage').src = __galleryImages[__galleryIndex];
    }
});

// Setup image click handlers
function setupImageClickHandlers() {
    console.log('[Image Handler] Setting up image click handlers...');
    
    function attachImageClickListener() {
        document.removeEventListener('click', handleImageClick);
        document.addEventListener('click', handleImageClick);
    }
    
    function handleImageClick(e) {
        const target = e.target;
        if (target.classList && target.classList.contains('clickable-image')) {
            e.preventDefault();
            e.stopPropagation();
            
            let imageUrl = target.getAttribute('data-image-url') || target.src;
            if (imageUrl && imageUrl !== '' && !imageUrl.includes('data:') && imageUrl !== 'undefined' && imageUrl !== 'null') {
                showImagePreview(imageUrl);
            } else {
                showNotification('URL hình ảnh không hợp lệ', 'error');
            }
        }
    }
    
    attachImageClickListener();
    setTimeout(attachImageClickListener, 100);
    setTimeout(attachImageClickListener, 500);
    setTimeout(attachImageClickListener, 1000);
}

// ==================== FILE VALIDATION & UPLOAD ====================

function validateFileBeforeUpload(file, resourceType = 'image') {
    if (!file) {
        return { valid: false, message: 'Vui lòng chọn file' };
    }
    
    const limits = {
        'image': 2 * 1024 * 1024,    // 2MB
        'video': 50 * 1024 * 1024,   // 50MB
        'raw': 10 * 1024 * 1024      // 10MB
    };
    
    const formats = {
        'image': ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        'video': ['mp4', 'webm'],
        'raw': ['pdf', 'docx', 'zip']
    };
    
    const maxSize = limits[resourceType] || limits['raw'];
    const allowedFormats = formats[resourceType] || [];
    
    const filename = file.name || '';
    const ext = filename.includes('.') 
        ? filename.split('.').pop().toLowerCase() 
        : '';
    
    if (!ext || !allowedFormats.includes(ext)) {
        return {
            valid: false,
            message: `Định dạng file không được hỗ trợ. Hãy dùng: ${allowedFormats.join(', ')}`
        };
    }
    
    if (file.size > maxSize) {
        const maxMB = Math.floor(maxSize / (1024 * 1024));
        return {
            valid: false,
            message: `Kích thước file vượt quá ${maxMB}MB`
        };
    }
    
    return { valid: true };
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    } catch (error) {
        return '-';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function triggerFileInput(uploadArea) {
    const fileInput = uploadArea.querySelector('.upload-area-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

// ==================== CART STORAGE ====================

const CART_STORAGE_KEY = 'cart';

function getCartItems() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter(item => item && typeof item.productID !== 'undefined')
            .map(item => ({
                productID: String(item.productID),
                quantity: normalizeCartQuantity(item.quantity)
            }))
            .filter(item => item.quantity > 0);
    } catch (error) {
        console.warn('Failed to parse cart from localStorage', error);
        return [];
    }
}

function saveCartItems(cartItems) {
    const safeItems = Array.isArray(cartItems) ? cartItems : [];
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(safeItems));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: safeItems }}));
    return safeItems;
}

function normalizeCartQuantity(quantity) {
    const numeric = Number.parseInt(quantity, 10);
    if (Number.isNaN(numeric) || numeric < 0) {
        return 0;
    }
    return numeric;
}

function addCartItem(productID, quantity = 1) {
    if (typeof productID === 'undefined' || productID === null) {
        throw new Error('productID is required');
    }
    const normalizedId = String(productID);
    const currentCart = getCartItems();
    const normalizedQuantity = Math.max(1, normalizeCartQuantity(quantity) || 1);
    const existing = currentCart.find(item => item.productID === normalizedId);

    if (existing) {
        existing.quantity = Math.max(1, existing.quantity + normalizedQuantity);
    } else {
        currentCart.push({ productID: normalizedId, quantity: normalizedQuantity });
    }

    return saveCartItems(currentCart);
}

function updateCartItem(productID, quantity) {
    const normalizedId = String(productID);
    const normalizedQuantity = normalizeCartQuantity(quantity);
    const currentCart = getCartItems();
    const itemIndex = currentCart.findIndex(item => item.productID === normalizedId);
    if (itemIndex === -1) {
        return currentCart;
    }

    if (normalizedQuantity <= 0) {
        currentCart.splice(itemIndex, 1);
    } else {
        currentCart[itemIndex].quantity = normalizedQuantity;
    }

    return saveCartItems(currentCart);
}

function removeCartItem(productID) {
    const normalizedId = String(productID);
    const currentCart = getCartItems().filter(item => item.productID !== normalizedId);
    return saveCartItems(currentCart);
}

function clearCart() {
    return saveCartItems([]);
}

function getCartQuantity() {
    return getCartItems().reduce((total, item) => total + normalizeCartQuantity(item.quantity), 0);
}

function getCartSummary() {
    return {
        items: getCartItems(),
        totalQuantity: getCartQuantity()
    };
}

// ==================== FORM FIELD ERROR HANDLING ====================

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        field.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearFieldErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
    
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => input.classList.remove('error'));
}

// ==================== UPLOAD PROGRESS ====================

function showUploadProgress(modalId = null) {
    const container = document.getElementById(`${modalId}ProgressContainer`) || 
                     document.querySelector('.upload-progress-container');
    if (container) {
        container.classList.add('show');
    }
    return container;
}

function hideUploadProgress(modalId = null) {
    const container = document.getElementById(`${modalId}ProgressContainer`) || 
                     document.querySelector('.upload-progress-container');
    if (container) {
        container.classList.remove('show');
    }
}

function updateUploadProgress(percent, modalId = null) {
    const fill = document.querySelector('.upload-progress-fill');
    const percentDisplay = document.querySelector('.upload-progress-percent');
    
    if (fill) {
        fill.style.width = percent + '%';
    }
    if (percentDisplay) {
        percentDisplay.textContent = Math.round(percent) + '%';
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    initClientHeaderNav();
});

window.addEventListener('load', function() {
    setupDragAndDrop();
    setupImageClickHandlers();
    initGlobalImageErrorHandling();
    applyFallbackToExistingImages();
    observeNewImagesForFallback();
    enhanceSidebarInteractiveNav();
});

// Row selection (click to select)
function initTableRowSelection() {
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(r => {
        r.addEventListener('click', function(e){
            // avoid when clicking buttons or inputs
            if (e.target.closest('button, a, input, select, textarea')) return;
            this.classList.toggle('row-selected');
        });
    });
}

// Global image error handling
function initGlobalImageErrorHandling() {
    // capture error events on all images
    document.addEventListener('error', function(e) {
        const t = e.target;
        if (!t || t.tagName !== 'IMG') return;
        if (t.dataset && t.dataset.fallbackApplied === 'true') return;
        const placeholder = buildImagePlaceholderDataUrl(
            Math.max(80, t.naturalWidth || t.width || 80),
            Math.max(80, t.naturalHeight || t.height || 80),
            'No Image'
        );
        t.dataset.fallbackApplied = 'true';
        t.src = placeholder;
        t.classList && t.classList.add('img-error');
    }, true);
}

function buildImagePlaceholderDataUrl(w, h, text) {
    const bg = '%23e6e6e6';
    const fg = '%23999';
    const safeText = encodeURIComponent(text || 'No Image');
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Crect fill='${bg}' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='${fg}' font-size='12'%3E${safeText}%3C/text%3E%3C/svg%3E`;
}

function applyFallbackToExistingImages() {
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
        // attach onerror if not yet
        if (!img.dataset || img.dataset.fallbackBound !== 'true') {
            img.onerror = function() {
                if (this.dataset && this.dataset.fallbackApplied === 'true') return;
                this.dataset.fallbackApplied = 'true';
                this.src = buildImagePlaceholderDataUrl(
                    Math.max(80, this.naturalWidth || this.width || 80),
                    Math.max(80, this.naturalHeight || this.height || 80),
                    'No Image'
                );
                this.classList.add('img-error');
            };
            img.dataset.fallbackBound = 'true';
        }
        // if already failed before load handler
        const isBroken = (img.complete && img.naturalWidth === 0);
        if (isBroken) {
            img.onerror && img.onerror();
        }
    });
}

function observeNewImagesForFallback() {
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes && m.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        // bind fallback and check broken
                        if (!node.dataset || node.dataset.fallbackBound !== 'true') {
                            node.onerror = function() {
                                if (this.dataset && this.dataset.fallbackApplied === 'true') return;
                                this.dataset.fallbackApplied = 'true';
                                this.src = buildImagePlaceholderDataUrl(
                                    Math.max(80, this.naturalWidth || this.width || 80),
                                    Math.max(80, this.naturalHeight || this.height || 80),
                                    'No Image'
                                );
                                this.classList.add('img-error');
                            };
                            node.dataset.fallbackBound = 'true';
                        }
                        if (node.complete && node.naturalWidth === 0) {
                            node.onerror && node.onerror();
                        }
                    } else {
                        // check any child imgs
                        const imgs = node.querySelectorAll && node.querySelectorAll('img');
                        imgs && imgs.forEach(img => {
                            if (!img.dataset || img.dataset.fallbackBound !== 'true') {
                                img.onerror = function() {
                                    if (this.dataset && this.dataset.fallbackApplied === 'true') return;
                                    this.dataset.fallbackApplied = 'true';
                                    this.src = buildImagePlaceholderDataUrl(
                                        Math.max(80, this.naturalWidth || this.width || 80),
                                        Math.max(80, this.naturalHeight || this.height || 80),
                                        'No Image'
                                    );
                                    this.classList.add('img-error');
                                };
                                img.dataset.fallbackBound = 'true';
                            }
                            if (img.complete && img.naturalWidth === 0) {
                                img.onerror && img.onerror();
                            }
                        });
                    }
                }
            });
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
}

// Sidebar interactive nav: ripple + active by location
function enhanceSidebarInteractiveNav() {
    try {
        const links = document.querySelectorAll('.sidebar-menu a');
        const setActiveByPath = () => {
            const path = (location.pathname || '') + (location.search || '');
            links.forEach(a => {
                const href = a.getAttribute('href');
                if (!href) return;
                if (path.startsWith(new URL(href, location.origin).pathname)) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });
        };
        setActiveByPath();
        links.forEach(a => {
            a.addEventListener('click', function(e){
                // ripple
                try {
                    this.classList.remove('rippling');
                    let ripple = this.querySelector('.ripple');
                    if (!ripple) { ripple = document.createElement('span'); ripple.className = 'ripple'; this.appendChild(ripple); }
                    const rect = this.getBoundingClientRect();
                    ripple.style.left = (e.clientX - rect.left) + 'px';
                    ripple.style.top = (e.clientY - rect.top) + 'px';
                    this.classList.add('rippling');
                    setTimeout(() => this.classList.remove('rippling'), 400);
                } catch(err) {}
                // allow navigation; active will be set after load
            });
        });
        window.addEventListener('popstate', setActiveByPath);
    } catch (err) {}
}
