// Product Management

const productManager = new EntityManager('products', `${BACKEND_URL}/products`, 'data-product-id');
const productThumbUpload = new ImageUploadManager({ resourceType: 'image', module: 'products', fieldName: 'thumbnailUrl' });
const productGalleryUpload = new ImageUploadManager({ resourceType: 'image', module: 'product-images', fieldName: 'imageUrl' });

let allCategories = [];

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadAllCategories() {
    try {
        const res = await apiCall(`${BACKEND_URL}/categories/advanced?page=1&size=1000&isActive=true&sort=name&direction=asc`, { method: 'GET' });
        if (res.ok && res.data) {
            const payload = res.data.data || res.data;
            // PaginatedResponseDTO có structure: { metadata: {...}, result: [...] }
            if (payload && payload.result && Array.isArray(payload.result)) {
                allCategories = payload.result;
            } else if (Array.isArray(payload)) {
                allCategories = payload;
            } else {
                allCategories = [];
            }
            return allCategories;
        }
        return [];
    } catch (error) {
        console.error('[Products] Error loading categories:', error);
        return [];
    }
}

function formatCategoryDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
    } catch (error) {
        return '-';
    }
}

function populateCategoriesMultiselect(wrapperId, selectedCategoryIds = []) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const dropdown = wrapper.querySelector('.multiselect-dropdown');
    const searchInput = wrapper.querySelector('.multiselect-search input');
    const selectedContainer = wrapper.querySelector('.multiselect-selected');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    
    if (!dropdown || !selectedContainer || !hiddenInput) return;
    
    let selectedIds = Array.isArray(selectedCategoryIds) ? [...selectedCategoryIds] : [];
    let searchQuery = '';
    
    function renderDropdown() {
        dropdown.innerHTML = '';
        
        if (allCategories.length === 0) {
            dropdown.innerHTML = '<div class="multiselect-loading">Chưa có danh mục</div>';
            return;
        }
        
        const filtered = allCategories.filter(cat => {
            if (!cat || !cat.id || !cat.isActive) return false;
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            const name = (cat.name || '').toLowerCase();
            const id = String(cat.id || '');
            return name.includes(query) || id.includes(query);
        });
        
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="multiselect-loading">Không tìm thấy danh mục</div>';
            return;
        }
        
        filtered.forEach((cat, index) => {
            const isSelected = selectedIds.includes(cat.id);
            const catName = cat.name || `Category #${cat.id}`;
            const createdAt = formatCategoryDate(cat.createdAt);
            
            const item = document.createElement('div');
            item.className = `multiselect-item ${isSelected ? 'selected' : ''}`;
            item.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} data-category-id="${cat.id}" />
                <div class="multiselect-item-label">
                    <span class="multiselect-item-name">${cat.id} - ${escapeHtml(catName)}</span>
                    <span class="multiselect-item-meta">Ngày tạo: ${createdAt}</span>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return;
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                toggleCategory(cat.id, checkbox.checked);
            });
            
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                toggleCategory(cat.id, e.target.checked);
            });
            
            dropdown.appendChild(item);
        });
    }
    
    function toggleCategory(categoryId, isSelected) {
        if (isSelected) {
            if (!selectedIds.includes(categoryId)) {
                selectedIds.push(categoryId);
            }
        } else {
            selectedIds = selectedIds.filter(id => id !== categoryId);
        }
        renderSelected();
        renderDropdown();
        updateHiddenInput();
    }
    
    function renderSelected() {
        selectedContainer.innerHTML = '';
        
        if (selectedIds.length === 0) {
            selectedContainer.innerHTML = '<div class="multiselect-selected-empty">Chưa chọn danh mục nào</div>';
            return;
        }
        
        selectedIds.forEach(categoryId => {
            const cat = allCategories.find(c => c && c.id === categoryId);
            if (!cat) return;
            
            const tag = document.createElement('div');
            tag.className = 'multiselect-tag';
            tag.innerHTML = `
                <span>${cat.id} - ${escapeHtml(cat.name || `Category #${cat.id}`)}</span>
                <span class="multiselect-tag-remove" data-category-id="${categoryId}">×</span>
            `;
            
            const removeBtn = tag.querySelector('.multiselect-tag-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCategory(categoryId, false);
            });
            
            selectedContainer.appendChild(tag);
        });
    }
    
    function updateHiddenInput() {
        hiddenInput.value = JSON.stringify(selectedIds.map(id => ({ id: id })));
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderDropdown();
        });
    }
    
    renderDropdown();
    renderSelected();
    updateHiddenInput();
}

window.addEventListener('load', function() {
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e){ e.preventDefault(); submitProductFilters(); });
    }
});

function submitProductFilters() {
    showContainerLoading('Đang lọc dữ liệu...');
    const url = new URL(window.location);
    ['id','name','sku','brand','isActive','search','page'].forEach(k => url.searchParams.delete(k));
    const id = document.getElementById('id')?.value || '';
    const name = document.getElementById('name')?.value || '';
    const sku = document.getElementById('sku')?.value || '';
    const brand = document.getElementById('brand')?.value || '';
    const isActive = document.getElementById('isActive')?.value || '';
    const search = document.getElementById('search')?.value || '';
    if (id.trim() !== '') url.searchParams.set('id', id.trim());
    if (name.trim() !== '') url.searchParams.set('name', name.trim());
    if (sku.trim() !== '') url.searchParams.set('sku', sku.trim());
    if (brand.trim() !== '') url.searchParams.set('brand', brand.trim());
    if (isActive !== '') url.searchParams.set('isActive', isActive);
    if (search.trim() !== '') url.searchParams.set('search', search.trim());
    window.location.href = url.toString();
}

function resetProductsFilters() {
    showContainerLoading('Đang xóa bộ lọc...');
    window.location.href = window.location.pathname;
}

// CREATE
async function showCreateProductModal() {
    clearCreateProductForm();
    await loadAllCategories();
    populateCategoriesMultiselect('createCategoriesWrapper', []);
    showModal('createProductModal');
}
function clearCreateProductForm() {
    const form = document.getElementById('createProductForm');
    if (form) {
        form.reset();
        document.getElementById('createIsActive').checked = true;
        document.getElementById('createIsFeatured').checked = false;
        deferredProductImages = [];
        const previewContainer = document.getElementById('createProductImagesPreviewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('show');
        }
        const thumbPreview = document.getElementById('createThumbnailUrlPreviewContainer');
        if (thumbPreview) {
            thumbPreview.innerHTML = '';
            thumbPreview.classList.remove('show');
        }
        const searchInput = document.getElementById('createCategoriesSearch');
        if (searchInput) searchInput.value = '';
        populateCategoriesMultiselect('createCategoriesWrapper', []);
    }
    clearFieldErrors('createProductForm');
}

let deferredProductImages = [];

function handleAddCreateProductImages(input) {
    console.log('[ProductCreate][Gallery] input change triggered');
    const files = Array.from(input.files || []);
    console.log('[ProductCreate][Gallery] files length =', files.length, files.map(f => f.name));
    if (!files.length) return;
    const container = document.getElementById('createProductImagesPreviewContainer');
    files.forEach((file, idx) => {
        const validation = validateFileBeforeUpload(file, 'image');
        if (!validation.valid) { console.warn('[ProductCreate][Gallery] validation failed', validation.message); showNotification(validation.message, 'error'); return; }
        deferredProductImages.push(file);
        if (container) { appendGalleryPreview(file, container); }
    });
    console.log('[ProductCreate][Gallery] deferredProductImages size =', deferredProductImages.length);
    input.value = '';
}

function appendGalleryPreview(file, container) {
    try {
        const reader = new FileReader();
        reader.onload = function(e) {
            const url = e.target.result;
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.marginRight = '8px';
            wrapper.innerHTML = `
                <img src="${url}" class="upload-preview-image" alt="Preview" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border-color);"/>
            `;
            container.appendChild(wrapper);
            container.classList.add('show');
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error('[ProductCreate][Gallery] preview error:', err);
    }
}

async function submitCreateProduct() {
    const form = document.getElementById('createProductForm');
    if (!form) return;
    const data = {
        name: form.querySelector('[name="name"]').value?.trim(),
        sku: form.querySelector('[name="sku"]').value?.trim(),
        price: parseFloat(form.querySelector('[name="price"]').value || '0') || null,
        discountPrice: parseFloat(form.querySelector('[name="discountPrice"]').value || '0') || null,
        stockQuantity: parseInt(form.querySelector('[name="stockQuantity"]').value || '0') || null,
        brand: form.querySelector('[name="brand"]').value?.trim() || null,
        color: form.querySelector('[name="color"]').value?.trim() || null,
        size: form.querySelector('[name="size"]').value?.trim() || null,
        weight: form.querySelector('[name="weight"]').value?.trim() || null,
        dimensions: form.querySelector('[name="dimensions"]').value?.trim() || null,
        specifications: form.querySelector('[name="specifications"]').value?.trim() || null,
        description: form.querySelector('[name="description"]').value?.trim() || null,
        thumbnailUrl: form.querySelector('[name="thumbnailUrl"]').value?.trim() || null,
        isActive: form.querySelector('[name="isActive"]').checked,
        isFeatured: form.querySelector('[name="isFeatured"]').checked
    };
    const categoriesHidden = document.getElementById('createCategories');
    if (categoriesHidden && categoriesHidden.value) {
        try {
            const selectedCategories = JSON.parse(categoriesHidden.value);
            if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
                data.categories = selectedCategories;
            }
        } catch (e) {
            console.error('[ProductCreate] Error parsing categories:', e);
        }
    }
    if (!data.name) { showFieldError('createName', 'Tên là bắt buộc'); showNotification('Vui lòng nhập tên', 'error'); return; }
    if (!data.sku) { showFieldError('createSku', 'SKU là bắt buộc'); showNotification('Vui lòng nhập SKU', 'error'); return; }

    console.log('[ProductCreate] Start submit');
    showUploadProgress('createProduct');
    let productIdForRollback = null;
    const createdImageIdsForRollback = [];
    try {
        const totalSteps = 1 /* product create */ + (deferredProductImages.length * 2) + 1 /* thumb upload (maybe 0) */;
        let doneSteps = 0;

        const bump = () => {
            doneSteps += 1;
            const percent = Math.min(100, Math.floor((doneSteps / totalSteps) * 100));
            updateUploadProgress(percent, 'createProduct');
        };

        // 1) Upload thumbnail (deferred via ImageUploadManager)
        const uploadResults = await productThumbUpload.uploadDeferredFiles((progress) => {
            updateUploadProgress((progress.current / progress.total) * 100, 'createProduct');
        });
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            hideUploadProgress('createProduct');
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            return;
        }
        if (Object.keys(uploadResults.urls).length > 0) {
            if (uploadResults.urls['createThumbnailUrlFile']) {
                data.thumbnailUrl = uploadResults.urls['createThumbnailUrlFile'];
            }
        }
        bump();

        // 2) Tạo product
        console.log('[ProductCreate] Creating product with data:', data);
        const createRes = await apiCall(`${BACKEND_URL}/products`, { method: 'POST', body: data });
        if (!createRes.ok) { throw new Error(createRes.data?.message || 'Tạo product thất bại'); }
        const createdProduct = createRes.data?.data || createRes.data; // support both wrapper or plain
        const productId = createdProduct?.id;
        if (!productId) { throw new Error('Không nhận được ID product sau khi tạo'); }
        productIdForRollback = productId;
        console.log('[ProductCreate] Product created, id =', productId);
        bump();

        // 3) Upload từng ảnh gallery và tạo ProductImage
        const createdImageIds = [];
        for (let i = 0; i < deferredProductImages.length; i++) {
            const file = deferredProductImages[i];
            console.log(`[ProductCreate] Uploading gallery image ${i+1}/${deferredProductImages.length}:`, file?.name);
            const up = await uploadFile(file, { resourceType: 'image', module: 'product-images', entityId: productId, purpose: 'imageUrl' });
            if (!up.success || !up.url) { throw new Error(`Upload ảnh thất bại: ${file?.name || ''}`); }
            bump();
            const body = { imageUrl: up.url, sortOrder: i + 1, isPrimary: false, product: { id: productId } };
            const imgRes = await apiCall(`${BACKEND_URL}/product-images`, { method: 'POST', body });
            if (!imgRes.ok) { throw new Error(imgRes.data?.message || 'Tạo ProductImage thất bại'); }
            const createdImg = imgRes.data?.data || imgRes.data;
            if (createdImg?.id) { createdImageIds.push(createdImg.id); createdImageIdsForRollback.push(createdImg.id); }
            console.log('[ProductCreate] Created ProductImage id =', createdImg?.id);
            bump();
        }

        // 4) Success
        hideUploadProgress('createProduct');
        showNotification('Tạo product + ảnh thành công!', 'success');
        deferredProductImages = [];
        closeModal('createProductModal');
        setTimeout(() => { window.location.href = window.location.href; }, 500);
    } catch (e) {
        console.error('[ProductCreate] Error:', e);
        showNotification('Lỗi tạo product: ' + (e.message || e), 'error');
        // Rollback: xóa các ProductImage đã tạo và Product nếu đã tạo
        try {
            if (createdImageIdsForRollback.length > 0) {
                console.log('[ProductCreate][Rollback] Deleting created images:', createdImageIdsForRollback);
                for (let i = createdImageIdsForRollback.length - 1; i >= 0; i--) {
                    const imgId = createdImageIdsForRollback[i];
                    await apiCall(`${BACKEND_URL}/product-images/${imgId}`, { method: 'DELETE' });
                }
            }
            if (productIdForRollback) {
                console.log('[ProductCreate][Rollback] Deleting product id =', productIdForRollback);
                await apiCall(`${BACKEND_URL}/products/${productIdForRollback}`, { method: 'DELETE' });
            }
        } catch (rbErr) {
            console.error('[ProductCreate][Rollback] Error during rollback:', rbErr);
        }
        hideUploadProgress('createProduct');
    }
}

function handleProductThumbnailUpload(input) { productThumbUpload.handleUpload(input, null); }

let productEditThumbUpload = null;
function handleEditProductThumbnailUpload(input) {
    if (!productEditThumbUpload) {
        productEditThumbUpload = new ImageUploadManager({
            fileInput: input,
            urlInput: document.getElementById('editThumbnailUrl'),
            previewContainer: document.getElementById('editThumbnailUrlPreviewContainer'),
            progressContainer: document.getElementById('editProductProgressContainer'),
            onUploadComplete: (url) => {
                if (url) {
                    document.getElementById('editThumbnailUrl').value = url;
                }
            }
        });
    }
    productEditThumbUpload.handleUpload(input, null);
}

// Quản lý ảnh trong form edit
let editProductId = null;
let editProductImages = []; // Danh sách ảnh hiện tại
let editProductImagesToAdd = []; // Ảnh mới cần thêm
let editProductImagesToDelete = []; // Ảnh cần xóa

function loadEditProductImages(productId, images) {
    editProductId = productId;
    editProductImages = Array.isArray(images) ? images : [];
    editProductImagesToAdd = [];
    editProductImagesToDelete = [];
    const container = document.getElementById('editProductImagesListContainer');
    if (!container) return;
    container.innerHTML = '';
    if (editProductImages.length === 0) {
        container.innerHTML = '<div class="empty-state">Không có ảnh</div>';
        return;
    }
    editProductImages.forEach((img, idx) => {
        if (!img || !img.imageUrl) return;
        const item = document.createElement('div');
        item.className = 'edit-image-item';
        item.innerHTML = `
            <img src="${img.imageUrl}" alt="Image ${idx + 1}" class="edit-image-preview" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23e6e6e6\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E'; this.classList.add('img-error');" />
            <button type="button" class="btn btn-danger btn-sm edit-image-delete" onclick="deleteEditProductImage(${img.id})" title="Xóa">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

async function handleAddEditProductImages(input) {
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    for (const file of files) {
        try {
            const uploaded = await uploadFile(file, { resourceType: 'image', module: 'product-images', entityId: editProductId, purpose: 'imageUrl' });
            if (uploaded.success && uploaded.url) {
                editProductImagesToAdd.push({ imageUrl: uploaded.url, sortOrder: editProductImages.length + editProductImagesToAdd.length + 1, isPrimary: false });
                // Hiển thị preview
                const previewContainer = document.getElementById('editProductImagesPreviewContainer');
                if (previewContainer) {
                    const img = document.createElement('img');
                    img.src = uploaded.url;
                    img.className = 'upload-preview-img';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23e6e6e6\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E';
                        this.classList.add('img-error');
                    };
                    previewContainer.appendChild(img);
                    previewContainer.classList.add('show');
                }
            }
        } catch (e) {
            console.error('[EditProduct][AddImage] Error:', e);
            showNotification('Lỗi upload ảnh: ' + (e.message || e), 'error');
        }
    }
    input.value = '';
}

async function deleteEditProductImage(imageId) {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
        const res = await apiCall(`${BACKEND_URL}/product-images/${imageId}`, { method: 'DELETE' });
        if (res.ok) {
            editProductImages = editProductImages.filter(img => img.id !== imageId);
            editProductImagesToDelete.push(imageId);
            loadEditProductImages(editProductId, editProductImages);
            showNotification('Xóa ảnh thành công', 'success');
        } else {
            showNotification(res.data?.message || 'Xóa ảnh thất bại', 'error');
        }
    } catch (e) {
        showNotification('Lỗi xóa ảnh: ' + (e.message || e), 'error');
    }
}


// GALLERY IMAGES
let currentProductIdForImages = null;
function openImagesDrawer(productId, productName) {
    currentProductIdForImages = productId;
    document.getElementById('imagesDrawerProductName').textContent = productName || '';
    openDrawer('productImagesDrawer');
}

function openGalleryModalFromButton(button) {
    console.log('[Gallery] openGalleryModalFromButton called', button);
    const productId = button.getAttribute('data-product-id');
    const productName = button.getAttribute('data-product-name');
    console.log('[Gallery] productId:', productId, 'productName:', productName);
    if (productId) {
        openGalleryModal(parseInt(productId), productName);
    } else {
        console.error('[Gallery] Missing productId from button');
        showNotification('Không tìm thấy ID product', 'error');
    }
}

async function handleAddProductImage(input) {
    const file = input.files[0]; if (!file || !currentProductIdForImages) return;
    try {
        const uploaded = await uploadFile(file, { resourceType: 'image', module: 'product-images', entityId: currentProductIdForImages, purpose: 'imageUrl' });
        if (!uploaded.success || !uploaded.url) { showNotification('Upload ảnh thất bại', 'error'); return; }
        const body = { imageUrl: uploaded.url, sortOrder: 1, isPrimary: false, product: { id: currentProductIdForImages } };
        const result = await apiCall(`${BACKEND_URL}/product-images`, { method: 'POST', body });
        if (result.ok && result.data.status === 'success') {
            showNotification('Thêm ảnh thành công', 'success');
        } else {
            showNotification(result.data?.message || 'Thêm ảnh thất bại', 'error');
        }
    } catch (e) {
        showNotification('Lỗi thêm ảnh: ' + e.message, 'error');
    } finally { input.value = ''; }
}

// VIEW DETAIL
async function viewProduct(id) {
    try {
        showTableLoading();
        showProductSkeleton(true);
        const res = await apiCall(`${BACKEND_URL}/products/${id}`, { method: 'GET' });
        if (res.ok && res.data) {
            const product = res.data.data || res.data;
            populateProductView(product);
            openDrawer('productDrawer');
        } else {
            showNotification('Không tải được chi tiết product', 'error');
        }
    } finally {
        hideTableLoading();
        showProductSkeleton(false);
    }
}

function populateProductView(p) {
    document.getElementById('viewProdId').textContent = p.id ?? '-';
    document.getElementById('viewProdName').textContent = p.name ?? '-';
    document.getElementById('viewProdSku').textContent = p.sku ?? '-';
    document.getElementById('viewProdBrand').textContent = p.brand ?? '-';
    const formatCurrency = (value) => {
        if (value == null) return '-';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };
    document.getElementById('viewProdPrice').textContent = p.price != null ? formatCurrency(p.price) : '-';
    document.getElementById('viewProdDiscountPrice').textContent = p.discountPrice != null ? formatCurrency(p.discountPrice) : '-';
    document.getElementById('viewProdStock').textContent = p.stockQuantity != null ? p.stockQuantity : '-';
    document.getElementById('viewProdColor').textContent = p.color ?? '-';
    document.getElementById('viewProdSize').textContent = p.size ?? '-';
    document.getElementById('viewProdWeight').textContent = p.weight ?? '-';
    document.getElementById('viewProdDimensions').textContent = p.dimensions ?? '-';
    document.getElementById('viewProdSpecifications').textContent = p.specifications ?? '-';
    document.getElementById('viewProdDescription').textContent = p.description ?? '-';
    const categoriesEl = document.getElementById('viewProdCategories');
    if (categoriesEl) {
        if (Array.isArray(p.categories) && p.categories.length > 0) {
            const categoryNames = p.categories.map(c => c?.name || `Category #${c?.id || ''}`).filter(n => n).join(', ');
            categoriesEl.textContent = categoryNames || '-';
        } else {
            categoriesEl.textContent = '-';
        }
    }
    document.getElementById('viewProdActive').textContent = p.isActive ? 'Active' : 'Inactive';
    document.getElementById('viewProdFeatured').textContent = p.isFeatured ? 'Có' : 'Không';
    const thumb = document.getElementById('viewProdThumb');
    const thumbSkel = document.getElementById('viewProdThumbSkeleton');
    const thumbEmpty = document.getElementById('viewProdThumbEmpty');
    if (thumb) {
        if (p.thumbnailUrl) {
            if (thumbSkel) thumbSkel.style.display = 'none';
            if (thumbEmpty) thumbEmpty.style.display = 'none';
            thumb.style.display = 'inline-block';
            thumb.src = p.thumbnailUrl;
            thumb.setAttribute('data-image-url', p.thumbnailUrl);
            handleImageError(thumb);
            // initialize gallery context for keyboard navigation
            initGalleryFromContainer('viewProdImages', p.thumbnailUrl);
        } else {
            thumb.style.display = 'none';
            if (thumbSkel) thumbSkel.style.display = 'none';
            if (thumbEmpty) thumbEmpty.style.display = 'block';
        }
    }
    const imagesSkel = document.getElementById('viewProdImagesSkeleton');
    const imagesEmpty = document.getElementById('viewProdImagesEmpty');
    const mainImg = document.getElementById('viewProdMain');
    const counter = document.getElementById('viewProdCounter');
    const strip = document.getElementById('viewProdThumbsStrip');
    strip.innerHTML = '';
    const images = Array.isArray(p.images) ? p.images : [];
    let currentIndex = 0;
    const selectIndex = (idx) => {
        if (!images[idx]) return;
        currentIndex = idx;
        const url = images[idx].imageUrl;
        if (mainImg) {
            mainImg.src = url;
            mainImg.style.display = 'block';
            handleImageError(mainImg);
            mainImg.onclick = () => showImagePreview(url);
        }
        if (counter) {
            counter.style.display = 'block';
            counter.textContent = (idx + 1) + ' / ' + images.length;
        }
        if (strip) {
            Array.from(strip.querySelectorAll('.gallery-thumb')).forEach((el, i) => {
                if (i === idx) el.classList.add('active'); else el.classList.remove('active');
            });
        }
    };
    images.forEach((img, idx) => {
        if (!img || !img.imageUrl) return;
        const t = document.createElement('img');
        t.src = img.imageUrl;
        t.className = 'gallery-thumb';
        t.setAttribute('data-image-url', img.imageUrl);
        handleImageError(t);
        t.onclick = () => selectIndex(idx);
        strip.appendChild(t);
    });
    if (images.length > 0) selectIndex(0);
    // set gallery list for keyboard navigation
    if (images.length > 0) {
        initGalleryFromContainer('viewProdThumbsStrip', null);
    }
    if (images.length === 0) {
        if (imagesEmpty) imagesEmpty.style.display = 'block';
    } else {
        if (imagesEmpty) imagesEmpty.style.display = 'none';
    }
}

function showProductSkeleton(show) {
    const tSkel = document.getElementById('viewProdThumbSkeleton');
    const iSkel = document.getElementById('viewProdImagesSkeleton');
    if (tSkel) tSkel.style.display = show ? 'inline-block' : 'none';
    if (iSkel) iSkel.style.display = show ? 'flex' : 'none';
}

// FULLSCREEN GALLERY
async function openGalleryModal(productId, productName) {
    console.log('[Gallery] openGalleryModal called', productId, productName);
    try {
        const modal = document.getElementById('productGalleryModal');
        if (!modal) {
            console.error('[Gallery] Modal #productGalleryModal not found');
            showNotification('Lỗi: Không tìm thấy modal gallery', 'error');
            return;
        }
        const res = await apiCall(`${BACKEND_URL}/products/${productId}`, { method: 'GET' });
        console.log('[Gallery] API response:', res);
        if (!res.ok) { 
            showNotification('Không tải được ảnh', 'error'); 
            return; 
        }
        const product = res.data.data || res.data;
        console.log('[Gallery] Product images:', product.images);
        renderGalleryModal(productName || ('Product #' + productId), product.images || []);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('[Gallery] Modal opened');
    } catch (e) {
        console.error('[Gallery] Error:', e);
        showNotification('Lỗi mở gallery: ' + e.message, 'error');
    }
}

function closeProductGallery() {
    document.getElementById('productGalleryModal').classList.remove('show');
    document.body.style.overflow = '';
}

// Helper: handle image error
function handleImageError(img, placeholder = null) {
    if (!placeholder) {
        placeholder = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23e6e6e6\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'14\'%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    img.onerror = function() {
        this.onerror = null;
        this.src = placeholder;
        this.classList.add('img-error');
    };
}

function renderGalleryModal(title, images) {
    const titleEl = document.getElementById('galleryTitle');
    const counter = document.getElementById('galleryCounter');
    const main = document.getElementById('galleryMain');
    const strip = document.getElementById('galleryStrip');
    titleEl.textContent = title || 'Danh sách ảnh';
    strip.innerHTML = '';
    let current = 0;
    const update = (idx) => {
        if (!images[idx]) return;
        current = idx;
        main.src = images[idx].imageUrl;
        handleImageError(main);
        counter.textContent = (idx + 1) + ' / ' + images.length;
        Array.from(strip.children).forEach((el, i) => { if (i === idx) el.classList.add('active'); else el.classList.remove('active'); });
    };
    images.forEach((img, idx) => {
        const t = document.createElement('img');
        t.src = img.imageUrl;
        t.className = 'gallery-modal-thumb';
        handleImageError(t);
        t.onclick = () => update(idx);
        strip.appendChild(t);
    });
    if (images.length > 0) update(0); else { main.removeAttribute('src'); counter.textContent = '0 / 0'; }

    // keyboard navigation
    const keyHandler = (e) => {
        if (!document.getElementById('productGalleryModal').classList.contains('show')) return;
        if (e.key === 'Escape') { closeProductGallery(); }
        if (e.key === 'ArrowRight' && images.length) { update((current + 1) % images.length); }
        if (e.key === 'ArrowLeft' && images.length) { update((current - 1 + images.length) % images.length); }
    };
    // ensure only one handler
    window.__galleryKeyHandler && document.removeEventListener('keydown', window.__galleryKeyHandler);
    window.__galleryKeyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
}

// Expose gallery helpers to global for inline onclick usage
window.openGalleryModalFromButton = openGalleryModalFromButton;
window.openGalleryModal = openGalleryModal;
window.closeProductGallery = closeProductGallery;


// EDIT VIA MODAL (FULL FORM)
async function openEditProductModal(id) {
    try {
        await loadAllCategories();
        const res = await apiCall(`${BACKEND_URL}/products/${id}`, { method: 'GET' });
        if (!res.ok) { showNotification('Không tải được product', 'error'); return; }
        const p = res.data.data || res.data;
        document.getElementById('editId').value = p.id;
        document.getElementById('editName').value = p.name || '';
        document.getElementById('editSku').value = p.sku || '';
        document.getElementById('editPrice').value = p.price ?? '';
        document.getElementById('editDiscountPrice').value = p.discountPrice ?? '';
        document.getElementById('editStock').value = p.stockQuantity ?? '';
        document.getElementById('editBrand').value = p.brand || '';
        document.getElementById('editColor').value = p.color || '';
        document.getElementById('editSize').value = p.size || '';
        document.getElementById('editWeight').value = p.weight || '';
        document.getElementById('editDimensions').value = p.dimensions || '';
        document.getElementById('editSpecifications').value = p.specifications || '';
        document.getElementById('editDescription').value = p.description || '';
        document.getElementById('editThumbnailUrl').value = p.thumbnailUrl || '';
        document.getElementById('editIsActive').checked = !!p.isActive;
        document.getElementById('editIsFeatured').checked = !!p.isFeatured;
        const selectedCategoryIds = Array.isArray(p.categories) ? p.categories.map(c => c?.id).filter(id => id != null) : [];
        const searchInput = document.getElementById('editCategoriesSearch');
        if (searchInput) searchInput.value = '';
        populateCategoriesMultiselect('editCategoriesWrapper', selectedCategoryIds);
        // Hiển thị preview thumbnail nếu có
        const previewContainer = document.getElementById('editThumbnailUrlPreviewContainer');
        if (previewContainer && p.thumbnailUrl) {
            previewContainer.innerHTML = `<img src="${p.thumbnailUrl}" alt="Thumbnail" class="upload-preview-img" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23e6e6e6\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E'; this.classList.add('img-error');" />`;
            previewContainer.classList.add('show');
        } else if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('show');
        }
        // Load danh sách ảnh hiện tại
        loadEditProductImages(p.id, p.images || []);
        showModal('editProductModal');
    } catch (e) {
        showNotification('Lỗi mở form edit: ' + (e.message || e), 'error');
    }
}

async function submitUpdateProduct() {
    const id = document.getElementById('editId').value;
    if (!id) { showNotification('Thiếu ID product', 'error'); return; }
    // Lấy thumbnailUrl từ input hoặc từ preview container (nếu user upload ảnh mới)
    let thumbnailUrl = document.getElementById('editThumbnailUrl').value?.trim() || null;
    const previewContainer = document.getElementById('editThumbnailUrlPreviewContainer');
    if (previewContainer && previewContainer.classList.contains('show')) {
        const previewImg = previewContainer.querySelector('img');
        if (previewImg && previewImg.src && !previewImg.src.startsWith('data:')) {
            thumbnailUrl = previewImg.src;
        }
    }
    const body = {
        name: document.getElementById('editName').value?.trim(),
        sku: document.getElementById('editSku').value?.trim(),
        price: parseFloat(document.getElementById('editPrice').value || '0') || null,
        discountPrice: parseFloat(document.getElementById('editDiscountPrice').value || '0') || null,
        stockQuantity: parseInt(document.getElementById('editStock').value || '0') || null,
        brand: document.getElementById('editBrand').value?.trim() || null,
        color: document.getElementById('editColor').value?.trim() || null,
        size: document.getElementById('editSize').value?.trim() || null,
        weight: document.getElementById('editWeight').value?.trim() || null,
        dimensions: document.getElementById('editDimensions').value?.trim() || null,
        specifications: document.getElementById('editSpecifications').value?.trim() || null,
        description: document.getElementById('editDescription').value?.trim() || null,
        thumbnailUrl: thumbnailUrl,
        isActive: document.getElementById('editIsActive').checked,
        isFeatured: document.getElementById('editIsFeatured').checked
    };
    const categoriesHidden = document.getElementById('editCategories');
    if (categoriesHidden) {
        if (categoriesHidden.value) {
            try {
                const selectedCategories = JSON.parse(categoriesHidden.value);
                body.categories = Array.isArray(selectedCategories) ? selectedCategories : [];
            } catch (e) {
                console.error('[ProductEdit] Error parsing categories:', e);
                body.categories = [];
            }
        } else {
            body.categories = [];
        }
    }
    if (!body.name) { showNotification('Tên là bắt buộc', 'error'); return; }
    if (!body.sku) { showNotification('SKU là bắt buộc', 'error'); return; }
    try {
        // Fetch đối tượng hiện tại để tránh null các field khác khi PUT
        const currentRes = await apiCall(`${BACKEND_URL}/products/${id}`, { method: 'GET' });
        if (!currentRes.ok) {
            showNotification('Không tải được dữ liệu hiện tại để cập nhật', 'error');
            return;
        }
        const current = currentRes.data.data || currentRes.data || {};
        const updateBody = {
            ...current,
            ...body
        };
        const res = await apiCall(`${BACKEND_URL}/products/${id}`, { method: 'PUT', body: updateBody });
        if (!res.ok) { showNotification(res.data?.message || 'Cập nhật thất bại', 'error'); return; }
        // Lưu ảnh mới nếu có
        if (editProductImagesToAdd.length > 0) {
            for (const imgData of editProductImagesToAdd) {
                try {
                    const imgBody = { ...imgData, product: { id: id } };
                    await apiCall(`${BACKEND_URL}/product-images`, { method: 'POST', body: imgBody });
                } catch (e) {
                    console.error('[EditProduct][AddImage] Error:', e);
                }
            }
        }
        showNotification('Cập nhật product thành công', 'success');
        closeModal('editProductModal');
        setTimeout(() => { window.location.reload(); }, 400);
    } catch (e) {
        showNotification('Lỗi cập nhật: ' + (e.message || e), 'error');
    }
}

// Mock Data Functions
function showMockDataMenu() {
    const container = document.getElementById('mockDataItemsContainer');
    if (!container) return;
    
    // Clear existing items
    container.innerHTML = '';
    
    // Populate mock data items
    if (window.mockProducts && Array.isArray(window.mockProducts)) {
        window.mockProducts.forEach((product, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'mock-data-item';
            itemDiv.style.cssText = 'padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;';
            itemDiv.onmouseover = function() { this.style.backgroundColor = 'var(--primary-light)'; };
            itemDiv.onmouseout = function() { this.style.backgroundColor = ''; };
            itemDiv.onclick = function() { selectMockProduct(index); };
            
            const price = product.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : '-';
            
            itemDiv.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(product.name || '-')}</div>
                <div style="font-size: 12px; color: var(--text-muted);">SKU: ${escapeHtml(product.sku || '-')}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Giá: ${price}</div>
            `;
            
            container.appendChild(itemDiv);
        });
    }
    showModal('mockDataMenu');
}

function selectMockProduct(index) {
    if (window.fillProductByIndex) {
        window.fillProductByIndex(index);
        closeModal('mockDataMenu');
        // Open create modal if not already open
        if (!document.getElementById('createProductModal')?.classList.contains('show')) {
            showCreateProductModal();
        }
    }
}

// expose
window.openEditProductModal = openEditProductModal;
window.submitUpdateProduct = submitUpdateProduct;
window.handleAddEditProductImages = handleAddEditProductImages;
window.deleteEditProductImage = deleteEditProductImage;
window.showMockDataMenu = showMockDataMenu;
window.selectMockProduct = selectMockProduct;

