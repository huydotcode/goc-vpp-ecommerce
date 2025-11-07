/**
 * Promotions Management - Logic cho trang quản lý promotions
 */

// Initialize managers
const promotionThumbUpload = new ImageUploadManager({
    resourceType: 'image',
    module: 'promotions',
    fieldName: 'thumbnailUrl'
});

let allProducts = [];
let conditionGroupCounter = 0;
let giftItemCounter = 0;

// PAGE SETUP
window.addEventListener('load', function() {
    setupFilterAndPaginationListeners();
});

function setupFilterAndPaginationListeners() {
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFilterWithLoading();
        });
    }
    const paginationLinks = document.querySelectorAll('.pagination a[href]');
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            goToPageWithLoading(this.href);
        });
    });
}

// FILTER
function submitFilterWithLoading() {
    showContainerLoading('Đang lọc dữ liệu...');
    const url = new URL(window.location);
    url.searchParams.delete('id');
    url.searchParams.delete('name');
    url.searchParams.delete('isActive');
    url.searchParams.delete('search');
    url.searchParams.delete('page');
    
    const id = document.getElementById('id')?.value || '';
    const name = document.getElementById('name')?.value || '';
    const isActive = document.getElementById('isActive')?.value || '';
    const search = document.getElementById('search')?.value || '';
    
    if (id.trim() !== '') url.searchParams.set('id', id.trim());
    if (name.trim() !== '') url.searchParams.set('name', name.trim());
    if (isActive !== '') url.searchParams.set('isActive', isActive);
    if (search.trim() !== '') url.searchParams.set('search', search.trim());
    
    window.location.href = url.toString();
}

function resetPromotionsFilters() {
    showContainerLoading('Đang xóa bộ lọc...');
    window.location.href = window.location.pathname;
}

function changePageSize() {
    const pageSize = document.getElementById('pageSize')?.value;
    if (!pageSize) return;
    const url = new URL(window.location);
    url.searchParams.set('size', pageSize);
    url.searchParams.set('page', '1');
    showContainerLoading('Đang tải...');
    window.location.href = url.toString();
}

// VIEW
async function viewPromotion(id) {
    try {
        showTableLoading();
        const res = await apiCall(`${BACKEND_URL}/promotions/${id}`, { method: 'GET' });
        if (res.ok && res.data) {
            const promotion = res.data.data || res.data;
            populatePromotionView(promotion);
            openDrawer('promotionDrawer');
        } else {
            showNotification('Không tải được chi tiết promotion', 'error');
        }
    } catch (e) {
        showNotification('Lỗi tải chi tiết promotion: ' + (e.message || e), 'error');
    } finally {
        hideTableLoading();
    }
}

function populatePromotionView(p) {
    document.getElementById('viewPromoId').textContent = p.id ?? '-';
    document.getElementById('viewPromoName').textContent = p.name ?? '-';
    
    const discountType = p.discountType || '-';
    const discountTypeText = discountType === 'DISCOUNT_AMOUNT' ? 'Giảm giá' : discountType === 'GIFT' ? 'Tặng quà' : '-';
    document.getElementById('viewPromoDiscountType').textContent = discountTypeText;
    
    let discountValue = '-';
    if (discountType === 'DISCOUNT_AMOUNT' && p.discountAmount) {
        discountValue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.discountAmount);
    } else if (discountType === 'GIFT' && p.giftItems && p.giftItems.length > 0) {
        discountValue = `${p.giftItems.length} sản phẩm`;
    }
    document.getElementById('viewPromoDiscountValue').textContent = discountValue;
    
    document.getElementById('viewPromoDescription').textContent = p.description ?? '-';
    document.getElementById('viewPromoActive').textContent = p.isActive ? 'Active' : 'Inactive';
    
    const thumb = document.getElementById('viewPromoThumb');
    const thumbSkel = document.getElementById('viewPromoThumbSkeleton');
    const thumbEmpty = document.getElementById('viewPromoThumbEmpty');
    if (thumb) {
        if (p.thumbnailUrl) {
            if (thumbSkel) thumbSkel.style.display = 'none';
            if (thumbEmpty) thumbEmpty.style.display = 'none';
            thumb.style.display = 'inline-block';
            thumb.src = p.thumbnailUrl;
            thumb.setAttribute('data-image-url', p.thumbnailUrl);
            handleImageError(thumb);
        } else {
            thumb.style.display = 'none';
            if (thumbSkel) thumbSkel.style.display = 'none';
            if (thumbEmpty) thumbEmpty.style.display = 'block';
        }
    }
    
    // Render conditions
    const conditionsContainer = document.getElementById('viewPromoConditionsContainer');
    if (conditionsContainer) {
        conditionsContainer.innerHTML = '';
        if (p.conditions && p.conditions.length > 0) {
            p.conditions.forEach((condition, idx) => {
                const operator = condition.operator === 'ALL' ? 'Tất cả' : condition.operator === 'ANY' ? 'Bất kỳ' : condition.operator;
                const details = condition.details || [];
                const conditionDiv = document.createElement('div');
                conditionDiv.className = 'desc-item';
                conditionDiv.style.marginBottom = '16px';
                conditionDiv.style.padding = '12px';
                conditionDiv.style.border = '1px solid var(--border-color)';
                conditionDiv.style.borderRadius = 'var(--radius-md)';
                conditionDiv.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 8px;">
                        <i class="fas fa-list"></i> Nhóm ${idx + 1}: ${operator}
                    </div>
                    <div style="margin-left: 16px;">
                        ${details.map(d => `
                            <div style="margin-bottom: 4px;">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 6px;"></i>
                                ${escapeHtml(d.productName || `Product #${d.productId}`)} - Số lượng: ${d.requiredQuantity || 0}
                            </div>
                        `).join('')}
                    </div>
                `;
                conditionsContainer.appendChild(conditionDiv);
            });
        } else {
            conditionsContainer.innerHTML = '<div class="empty-state">Không có điều kiện</div>';
        }
    }
    
    // Render gift items
    const giftItemsContainer = document.getElementById('viewPromoGiftItemsContainer');
    const giftItemsSection = document.getElementById('viewPromoGiftItemsSection');
    if (giftItemsContainer && giftItemsSection) {
        giftItemsContainer.innerHTML = '';
        if (p.giftItems && p.giftItems.length > 0) {
            giftItemsSection.style.display = 'block';
            p.giftItems.forEach(gift => {
                const giftDiv = document.createElement('div');
                giftDiv.className = 'desc-item';
                giftDiv.style.marginBottom = '8px';
                giftDiv.style.padding = '8px';
                giftDiv.style.border = '1px solid var(--border-color)';
                giftDiv.style.borderRadius = 'var(--radius-md)';
                giftDiv.innerHTML = `
                    <i class="fas fa-gift" style="color: var(--info-color); margin-right: 6px;"></i>
                    ${escapeHtml(gift.productName || `Product #${gift.productId}`)} - Số lượng: ${gift.quantity || 0}
                `;
                giftItemsContainer.appendChild(giftDiv);
            });
        } else {
            giftItemsSection.style.display = 'none';
        }
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// LOAD PRODUCTS
async function loadAllProducts() {
    try {
        const res = await apiCall(`${BACKEND_URL}/products/advanced?page=1&size=1000&isActive=true&sort=name&direction=asc`, { method: 'GET' });
        if (res.ok && res.data) {
            const payload = res.data.data || res.data;
            if (payload && payload.result && Array.isArray(payload.result)) {
                allProducts = payload.result;
            } else if (Array.isArray(payload)) {
                allProducts = payload;
            } else {
                allProducts = [];
            }
            return allProducts;
        }
        return [];
    } catch (error) {
        console.error('[Promotions] Error loading products:', error);
        return [];
    }
}

// CREATE
async function showCreatePromotionModal() {
    clearCreatePromotionForm();
    await loadAllProducts();
    addCreateConditionGroup();
    showModal('createPromotionModal');
}

function clearCreatePromotionForm() {
    const form = document.getElementById('createPromotionForm');
    if (form) {
        form.reset();
        document.getElementById('createIsActive').checked = true;
        document.getElementById('createDiscountType').value = '';
        document.getElementById('createDiscountAmountGroup').style.display = 'none';
        document.getElementById('createGiftItemsGroup').style.display = 'none';
        document.getElementById('createConditionsContainer').innerHTML = '';
        document.getElementById('createGiftItemsContainer').innerHTML = '';
        conditionGroupCounter = 0;
        giftItemCounter = 0;
        const previewContainer = document.getElementById('createThumbnailUrlPreviewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('show');
        }
    }
    clearFieldErrors('createPromotionForm');
}

function handleDiscountTypeChange(isCreate = true) {
    const prefix = isCreate ? 'create' : 'edit';
    const discountType = document.getElementById(`${prefix}DiscountType`).value;
    const discountAmountGroup = document.getElementById(`${prefix}DiscountAmountGroup`);
    const giftItemsGroup = document.getElementById(`${prefix}GiftItemsGroup`);
    
    if (discountType === 'DISCOUNT_AMOUNT') {
        if (discountAmountGroup) discountAmountGroup.style.display = 'block';
        if (giftItemsGroup) giftItemsGroup.style.display = 'none';
    } else if (discountType === 'GIFT') {
        if (discountAmountGroup) discountAmountGroup.style.display = 'none';
        if (giftItemsGroup) giftItemsGroup.style.display = 'block';
    } else {
        if (discountAmountGroup) discountAmountGroup.style.display = 'none';
        if (giftItemsGroup) giftItemsGroup.style.display = 'none';
    }
}

function addCreateConditionGroup() {
    const container = document.getElementById('createConditionsContainer');
    if (!container) return;
    
    const groupId = `create_condition_group_${conditionGroupCounter++}`;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'condition-group';
    groupDiv.id = groupId;
    groupDiv.style.marginBottom = '16px';
    groupDiv.style.padding = '16px';
    groupDiv.style.border = '1px solid var(--border-color)';
    groupDiv.style.borderRadius = 'var(--radius-md)';
    groupDiv.style.backgroundColor = 'var(--bg-color)';
    groupDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <label style="font-weight: 600;">Nhóm điều kiện</label>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeConditionGroup('${groupId}')">
                <i class="fas fa-times"></i> Xóa nhóm
            </button>
        </div>
        <div class="form-group">
            <label>Toán tử</label>
            <select class="form-control condition-operator">
                <option value="ALL">Tất cả (ALL)</option>
                <option value="ANY">Bất kỳ (ANY)</option>
            </select>
        </div>
        <div class="condition-details" style="margin-top: 12px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Chi tiết điều kiện</label>
            <div class="condition-details-list"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addConditionDetail('${groupId}')">
                <i class="fas fa-plus"></i> Thêm sản phẩm
            </button>
        </div>
    `;
    container.appendChild(groupDiv);
    addConditionDetail(groupId);
}

function addConditionDetail(groupId) {
    const groupDiv = document.getElementById(groupId);
    if (!groupDiv) return;
    
    const detailsList = groupDiv.querySelector('.condition-details-list');
    if (!detailsList) return;
    
    const detailId = `detail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const detailDiv = document.createElement('div');
    detailDiv.className = 'condition-detail-item';
    detailDiv.id = detailId;
    detailDiv.style.display = 'flex';
    detailDiv.style.gap = '8px';
    detailDiv.style.marginBottom = '8px';
    detailDiv.style.alignItems = 'flex-end';
    detailDiv.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label>Sản phẩm *</label>
            <select class="form-control condition-product" required>
                <option value="">Chọn sản phẩm...</option>
                ${allProducts.map(p => `
                    <option value="${p.id}">${p.id} - ${escapeHtml(p.name || '')}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group" style="width: 150px;">
            <label>Số lượng *</label>
            <input type="number" class="form-control condition-quantity" min="1" value="1" required />
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeConditionDetail('${detailId}')" style="height: 38px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    detailsList.appendChild(detailDiv);
}

function removeConditionGroup(groupId) {
    const groupDiv = document.getElementById(groupId);
    if (groupDiv) groupDiv.remove();
}

function removeConditionDetail(detailId) {
    const detailDiv = document.getElementById(detailId);
    if (detailDiv) detailDiv.remove();
}

function addCreateGiftItem() {
    const container = document.getElementById('createGiftItemsContainer');
    if (!container) return;
    
    const itemId = `create_gift_item_${giftItemCounter++}`;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gift-item';
    itemDiv.id = itemId;
    itemDiv.style.display = 'flex';
    itemDiv.style.gap = '8px';
    itemDiv.style.marginBottom = '8px';
    itemDiv.style.alignItems = 'flex-end';
    itemDiv.style.padding = '12px';
    itemDiv.style.border = '1px solid var(--border-color)';
    itemDiv.style.borderRadius = 'var(--radius-md)';
    itemDiv.style.backgroundColor = 'var(--bg-color)';
    itemDiv.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label>Sản phẩm *</label>
            <select class="form-control gift-product" required>
                <option value="">Chọn sản phẩm...</option>
                ${allProducts.map(p => `
                    <option value="${p.id}">${p.id} - ${escapeHtml(p.name || '')}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group" style="width: 150px;">
            <label>Số lượng *</label>
            <input type="number" class="form-control gift-quantity" min="1" value="1" required />
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeGiftItem('${itemId}')" style="height: 38px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

function removeGiftItem(itemId) {
    const itemDiv = document.getElementById(itemId);
    if (itemDiv) itemDiv.remove();
}

async function submitCreatePromotion() {
    const form = document.getElementById('createPromotionForm');
    if (!form) return;
    
    const name = document.getElementById('createName').value?.trim();
    const discountType = document.getElementById('createDiscountType').value;
    const description = document.getElementById('createDescription').value?.trim() || null;
    const isActive = document.getElementById('createIsActive').checked;
    
    if (!name) {
        showFieldError('createName', 'Tên là bắt buộc');
        showNotification('Vui lòng nhập tên', 'error');
        return;
    }
    
    if (!discountType) {
        showNotification('Vui lòng chọn loại giảm giá', 'error');
        return;
    }
    
    const promotionData = {
        name: name,
        description: description,
        discountType: discountType,
        isActive: isActive
    };
    
    if (discountType === 'DISCOUNT_AMOUNT') {
        const discountAmount = parseFloat(document.getElementById('createDiscountAmount').value || '0');
        if (discountAmount <= 0) {
            showNotification('Số tiền giảm phải lớn hơn 0', 'error');
            return;
        }
        promotionData.discountAmount = discountAmount;
    }
    
    // Build conditions
    const conditionGroups = [];
    const conditionGroupDivs = document.querySelectorAll('#createConditionsContainer .condition-group');
    conditionGroupDivs.forEach(groupDiv => {
        const operator = groupDiv.querySelector('.condition-operator').value;
        const details = [];
        const detailDivs = groupDiv.querySelectorAll('.condition-detail-item');
        detailDivs.forEach(detailDiv => {
            const productId = parseInt(detailDiv.querySelector('.condition-product').value);
            const quantity = parseInt(detailDiv.querySelector('.condition-quantity').value || '1');
            if (productId && quantity > 0) {
                details.push({
                    productId: productId,
                    requiredQuantity: quantity
                });
            }
        });
        if (details.length > 0) {
            conditionGroups.push({
                operator: operator,
                details: details
            });
        }
    });
    
    if (conditionGroups.length === 0) {
        showNotification('Vui lòng thêm ít nhất một nhóm điều kiện', 'error');
        return;
    }
    promotionData.conditions = conditionGroups;
    
    // Build gift items if GIFT type
    if (discountType === 'GIFT') {
        const giftItems = [];
        const giftItemDivs = document.querySelectorAll('#createGiftItemsContainer .gift-item');
        giftItemDivs.forEach(itemDiv => {
            const productId = parseInt(itemDiv.querySelector('.gift-product').value);
            const quantity = parseInt(itemDiv.querySelector('.gift-quantity').value || '1');
            if (productId && quantity > 0) {
                giftItems.push({
                    productId: productId,
                    quantity: quantity
                });
            }
        });
        if (giftItems.length === 0) {
            showNotification('Vui lòng thêm ít nhất một sản phẩm tặng kèm', 'error');
            return;
        }
        promotionData.giftItems = giftItems;
    }
    
    try {
        showUploadProgress('createPromotion');
        
        // Upload thumbnail
        const uploadResults = await promotionThumbUpload.uploadDeferredFiles((progress) => {
            updateUploadProgress((progress.current / progress.total) * 100, 'createPromotion');
        });
        
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            hideUploadProgress('createPromotion');
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            return;
        }
        
        if (Object.keys(uploadResults.urls).length > 0) {
            if (uploadResults.urls['createThumbnailUrlFile']) {
                promotionData.thumbnailUrl = uploadResults.urls['createThumbnailUrlFile'];
            }
        }
        
        hideUploadProgress('createPromotion');
        
        const createRes = await apiCall(`${BACKEND_URL}/promotions`, { method: 'POST', body: promotionData });
        if (!createRes.ok) {
            throw new Error(createRes.data?.message || 'Tạo promotion thất bại');
        }
        
        showNotification('Tạo promotion thành công!', 'success');
        closeModal('createPromotionModal');
        setTimeout(() => { window.location.reload(); }, 500);
    } catch (e) {
        hideUploadProgress('createPromotion');
        showNotification('Lỗi tạo promotion: ' + (e.message || e), 'error');
    }
}

function handlePromotionThumbnailUpload(input) {
    promotionThumbUpload.handleUpload(input, null);
}

// EDIT
let editPromotionThumbUpload = null;
function handleEditPromotionThumbnailUpload(input) {
    if (!editPromotionThumbUpload) {
        editPromotionThumbUpload = new ImageUploadManager({
            fileInput: input,
            urlInput: document.getElementById('editThumbnailUrl'),
            previewContainer: document.getElementById('editThumbnailUrlPreviewContainer'),
            progressContainer: document.getElementById('editPromotionProgressContainer'),
            resourceType: 'image',
            module: 'promotions',
            fieldName: 'thumbnailUrl'
        });
    }
    editPromotionThumbUpload.handleUpload(input, null);
}

async function openEditPromotionModal(id) {
    try {
        await loadAllProducts();
        const res = await apiCall(`${BACKEND_URL}/promotions/${id}`, { method: 'GET' });
        if (!res.ok) {
            showNotification('Không tải được promotion', 'error');
            return;
        }
        const p = res.data.data || res.data;
        
        document.getElementById('editId').value = p.id;
        document.getElementById('editName').value = p.name || '';
        document.getElementById('editDescription').value = p.description || '';
        document.getElementById('editDiscountType').value = p.discountType || '';
        document.getElementById('editIsActive').checked = !!p.isActive;
        
        handleDiscountTypeChange(false);
        
        if (p.discountType === 'DISCOUNT_AMOUNT' && p.discountAmount) {
            document.getElementById('editDiscountAmount').value = p.discountAmount;
        }
        
        if (p.thumbnailUrl) {
            document.getElementById('editThumbnailUrl').value = p.thumbnailUrl;
            const previewContainer = document.getElementById('editThumbnailUrlPreviewContainer');
            if (previewContainer) {
                previewContainer.innerHTML = `<img src="${p.thumbnailUrl}" alt="Thumbnail" class="upload-preview-img" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23e6e6e6\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E'; this.classList.add('img-error');" />`;
                previewContainer.classList.add('show');
            }
        }
        
        // Render conditions
        const conditionsContainer = document.getElementById('editConditionsContainer');
        conditionsContainer.innerHTML = '';
        conditionGroupCounter = 0;
        if (p.conditions && p.conditions.length > 0) {
            p.conditions.forEach(condition => {
                addEditConditionGroup(condition);
            });
        } else {
            addEditConditionGroup();
        }
        
        // Render gift items
        const giftItemsContainer = document.getElementById('editGiftItemsContainer');
        giftItemsContainer.innerHTML = '';
        giftItemCounter = 0;
        if (p.giftItems && p.giftItems.length > 0) {
            p.giftItems.forEach(gift => {
                addEditGiftItem(gift);
            });
        }
        
        showModal('editPromotionModal');
    } catch (e) {
        showNotification('Lỗi mở form edit: ' + (e.message || e), 'error');
    }
}

function addEditConditionGroup(condition = null) {
    const container = document.getElementById('editConditionsContainer');
    if (!container) return;
    
    const groupId = `edit_condition_group_${conditionGroupCounter++}`;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'condition-group';
    groupDiv.id = groupId;
    groupDiv.style.marginBottom = '16px';
    groupDiv.style.padding = '16px';
    groupDiv.style.border = '1px solid var(--border-color)';
    groupDiv.style.borderRadius = 'var(--radius-md)';
    groupDiv.style.backgroundColor = 'var(--bg-color)';
    groupDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <label style="font-weight: 600;">Nhóm điều kiện</label>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeConditionGroup('${groupId}')">
                <i class="fas fa-times"></i> Xóa nhóm
            </button>
        </div>
        <div class="form-group">
            <label>Toán tử</label>
            <select class="form-control condition-operator">
                <option value="ALL" ${condition && condition.operator === 'ALL' ? 'selected' : ''}>Tất cả (ALL)</option>
                <option value="ANY" ${condition && condition.operator === 'ANY' ? 'selected' : ''}>Bất kỳ (ANY)</option>
            </select>
        </div>
        <div class="condition-details" style="margin-top: 12px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Chi tiết điều kiện</label>
            <div class="condition-details-list"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addConditionDetail('${groupId}')">
                <i class="fas fa-plus"></i> Thêm sản phẩm
            </button>
        </div>
    `;
    container.appendChild(groupDiv);
    
    if (condition && condition.details && condition.details.length > 0) {
        condition.details.forEach(detail => {
            addEditConditionDetail(groupId, detail);
        });
    } else {
        addConditionDetail(groupId);
    }
}

function addEditConditionDetail(groupId, detail = null) {
    const groupDiv = document.getElementById(groupId);
    if (!groupDiv) return;
    
    const detailsList = groupDiv.querySelector('.condition-details-list');
    if (!detailsList) return;
    
    const detailId = `detail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const detailDiv = document.createElement('div');
    detailDiv.className = 'condition-detail-item';
    detailDiv.id = detailId;
    detailDiv.style.display = 'flex';
    detailDiv.style.gap = '8px';
    detailDiv.style.marginBottom = '8px';
    detailDiv.style.alignItems = 'flex-end';
    detailDiv.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label>Sản phẩm *</label>
            <select class="form-control condition-product" required>
                <option value="">Chọn sản phẩm...</option>
                ${allProducts.map(p => `
                    <option value="${p.id}" ${detail && detail.productId === p.id ? 'selected' : ''}>${p.id} - ${escapeHtml(p.name || '')}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group" style="width: 150px;">
            <label>Số lượng *</label>
            <input type="number" class="form-control condition-quantity" min="1" value="${detail ? detail.requiredQuantity : 1}" required />
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeConditionDetail('${detailId}')" style="height: 38px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    detailsList.appendChild(detailDiv);
}

function addEditGiftItem(gift = null) {
    const container = document.getElementById('editGiftItemsContainer');
    if (!container) return;
    
    const itemId = `edit_gift_item_${giftItemCounter++}`;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gift-item';
    itemDiv.id = itemId;
    itemDiv.style.display = 'flex';
    itemDiv.style.gap = '8px';
    itemDiv.style.marginBottom = '8px';
    itemDiv.style.alignItems = 'flex-end';
    itemDiv.style.padding = '12px';
    itemDiv.style.border = '1px solid var(--border-color)';
    itemDiv.style.borderRadius = 'var(--radius-md)';
    itemDiv.style.backgroundColor = 'var(--bg-color)';
    itemDiv.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label>Sản phẩm *</label>
            <select class="form-control gift-product" required>
                <option value="">Chọn sản phẩm...</option>
                ${allProducts.map(p => `
                    <option value="${p.id}" ${gift && gift.productId === p.id ? 'selected' : ''}>${p.id} - ${escapeHtml(p.name || '')}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group" style="width: 150px;">
            <label>Số lượng *</label>
            <input type="number" class="form-control gift-quantity" min="1" value="${gift ? gift.quantity : 1}" required />
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeGiftItem('${itemId}')" style="height: 38px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

async function submitUpdatePromotion() {
    const id = document.getElementById('editId').value;
    if (!id) {
        showNotification('Thiếu ID promotion', 'error');
        return;
    }
    
    const name = document.getElementById('editName').value?.trim();
    const discountType = document.getElementById('editDiscountType').value;
    const description = document.getElementById('editDescription').value?.trim() || null;
    const isActive = document.getElementById('editIsActive').checked;
    
    if (!name) {
        showNotification('Tên là bắt buộc', 'error');
        return;
    }
    
    if (!discountType) {
        showNotification('Vui lòng chọn loại giảm giá', 'error');
        return;
    }
    
    let thumbnailUrl = document.getElementById('editThumbnailUrl').value?.trim() || null;
    const previewContainer = document.getElementById('editThumbnailUrlPreviewContainer');
    if (previewContainer && previewContainer.classList.contains('show')) {
        const previewImg = previewContainer.querySelector('img');
        if (previewImg && previewImg.src && !previewImg.src.startsWith('data:')) {
            thumbnailUrl = previewImg.src;
        }
    }
    
    const promotionData = {
        name: name,
        description: description,
        discountType: discountType,
        thumbnailUrl: thumbnailUrl,
        isActive: isActive
    };
    
    if (discountType === 'DISCOUNT_AMOUNT') {
        const discountAmount = parseFloat(document.getElementById('editDiscountAmount').value || '0');
        if (discountAmount <= 0) {
            showNotification('Số tiền giảm phải lớn hơn 0', 'error');
            return;
        }
        promotionData.discountAmount = discountAmount;
    }
    
    // Build conditions
    const conditionGroups = [];
    const conditionGroupDivs = document.querySelectorAll('#editConditionsContainer .condition-group');
    conditionGroupDivs.forEach(groupDiv => {
        const operator = groupDiv.querySelector('.condition-operator').value;
        const details = [];
        const detailDivs = groupDiv.querySelectorAll('.condition-detail-item');
        detailDivs.forEach(detailDiv => {
            const productId = parseInt(detailDiv.querySelector('.condition-product').value);
            const quantity = parseInt(detailDiv.querySelector('.condition-quantity').value || '1');
            if (productId && quantity > 0) {
                details.push({
                    productId: productId,
                    requiredQuantity: quantity
                });
            }
        });
        if (details.length > 0) {
            conditionGroups.push({
                operator: operator,
                details: details
            });
        }
    });
    
    if (conditionGroups.length === 0) {
        showNotification('Vui lòng thêm ít nhất một nhóm điều kiện', 'error');
        return;
    }
    promotionData.conditions = conditionGroups;
    
    // Build gift items if GIFT type
    if (discountType === 'GIFT') {
        const giftItems = [];
        const giftItemDivs = document.querySelectorAll('#editGiftItemsContainer .gift-item');
        giftItemDivs.forEach(itemDiv => {
            const productId = parseInt(itemDiv.querySelector('.gift-product').value);
            const quantity = parseInt(itemDiv.querySelector('.gift-quantity').value || '1');
            if (productId && quantity > 0) {
                giftItems.push({
                    productId: productId,
                    quantity: quantity
                });
            }
        });
        if (giftItems.length === 0) {
            showNotification('Vui lòng thêm ít nhất một sản phẩm tặng kèm', 'error');
            return;
        }
        promotionData.giftItems = giftItems;
    }
    
    try {
        showUploadProgress('editPromotion');
        
        // Upload thumbnail if new file uploaded
        if (editPromotionThumbUpload) {
            const uploadResults = await editPromotionThumbUpload.uploadDeferredFiles((progress) => {
                updateUploadProgress((progress.current / progress.total) * 100, 'editPromotion');
            });
            
            if (!uploadResults.success && uploadResults.failed.length > 0) {
                hideUploadProgress('editPromotion');
                showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
                return;
            }
            
            if (Object.keys(uploadResults.urls).length > 0) {
                if (uploadResults.urls['editThumbnailUrlFile']) {
                    promotionData.thumbnailUrl = uploadResults.urls['editThumbnailUrlFile'];
                }
            }
        }
        
        hideUploadProgress('editPromotion');
        
        const updateRes = await apiCall(`${BACKEND_URL}/promotions/${id}`, { method: 'PUT', body: promotionData });
        if (!updateRes.ok) {
            throw new Error(updateRes.data?.message || 'Cập nhật promotion thất bại');
        }
        
        showNotification('Cập nhật promotion thành công', 'success');
        closeModal('editPromotionModal');
        setTimeout(() => { window.location.reload(); }, 500);
    } catch (e) {
        hideUploadProgress('editPromotion');
        showNotification('Lỗi cập nhật promotion: ' + (e.message || e), 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const createDiscountType = document.getElementById('createDiscountType');
    if (createDiscountType) {
        createDiscountType.addEventListener('change', () => handleDiscountTypeChange(true));
    }
    
    const editDiscountType = document.getElementById('editDiscountType');
    if (editDiscountType) {
        editDiscountType.addEventListener('change', () => handleDiscountTypeChange(false));
    }
});

// Expose functions globally
window.showCreatePromotionModal = showCreatePromotionModal;
window.submitCreatePromotion = submitCreatePromotion;
window.handlePromotionThumbnailUpload = handlePromotionThumbnailUpload;
window.openEditPromotionModal = openEditPromotionModal;
window.submitUpdatePromotion = submitUpdatePromotion;
window.handleEditPromotionThumbnailUpload = handleEditPromotionThumbnailUpload;
window.viewPromotion = viewPromotion;
window.resetPromotionsFilters = resetPromotionsFilters;
window.changePageSize = changePageSize;
window.addCreateConditionGroup = addCreateConditionGroup;
window.addCreateGiftItem = addCreateGiftItem;
window.addEditConditionGroup = addEditConditionGroup;
window.addEditGiftItem = addEditGiftItem;
window.addConditionDetail = addConditionDetail;
window.removeConditionGroup = removeConditionGroup;
window.removeConditionDetail = removeConditionDetail;
window.removeGiftItem = removeGiftItem;

