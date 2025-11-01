/**
 * Categories Management - Logic cho trang quản lý categories (Refactored)
 */

// Initialize managers
const cateManager = new EntityManager('categories', `${BACKEND_URL}/categories`, 'data-cate-id');
const thumbnailUploadManager = new ImageUploadManager({
    resourceType: 'image',
    module: 'categories',
    fieldName: 'thumbnailUrl'
});

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
    
    // ID filter takes absolute priority
    if (id.trim() !== '') url.searchParams.set('id', id.trim());
    if (name.trim() !== '') url.searchParams.set('name', name.trim());
    if (isActive !== '') url.searchParams.set('isActive', isActive);
    if (search.trim() !== '') url.searchParams.set('search', search.trim());
    
    window.location.href = url.toString();
}

function resetCategoriesFilters() {
    showContainerLoading('Đang xóa bộ lọc...');
    window.location.href = window.location.pathname;
}

// VIEW
function viewCategory(id) {
    const row = document.querySelector(`tr[data-cate-id='${id}']`);
    if (!row) return;
    
    const getText = (sel) => {
        const el = row.querySelector(sel);
        return el ? (el.textContent || '').trim() : '';
    };
    
    const thumbImg = row.querySelector('td:nth-child(3) img');
    const name = getText('td:nth-child(2) .cell-view');
    const desc = getText('td:nth-child(4) .cell-view');
    const isActiveText = getText('td:nth-child(5) .cell-view');
    
    document.getElementById('viewCateId').textContent = id || '-';
    document.getElementById('viewCateName').textContent = name || '-';
    document.getElementById('viewCateDescription').textContent = desc || '-';
    
    const activeEl = document.getElementById('viewCateIsActive');
    activeEl.textContent = '';
    activeEl.className = 'info-value';
    if (isActiveText.toLowerCase().includes('active')) {
        activeEl.innerHTML = '<span class=\"badge bg-success\">Active</span>';
    } else if (isActiveText.toLowerCase().includes('inactive')) {
        activeEl.innerHTML = '<span class=\"badge bg-danger\">Inactive</span>';
    } else {
        activeEl.textContent = '-';
    }
    
    const viewImg = document.getElementById('viewCateThumbnail');
    if (thumbImg && thumbImg.getAttribute('src')) {
        viewImg.src = thumbImg.getAttribute('src');
        viewImg.style.display = '';
    } else {
        viewImg.removeAttribute('src');
        viewImg.style.display = 'none';
    }
    
    openDrawer('cateDrawer');
}

// CREATE
function showCreateCategoryModal() {
    clearCreateCategoryForm();
    showModal('createCategoryModal');
}

function clearCreateCategoryForm() {
    const form = document.getElementById('createCategoryForm');
    if (form) form.reset();
    clearFieldErrors('createCategoryForm');
}

async function submitCreateCategory() {
    const form = document.getElementById('createCategoryForm');
    if (!form) return;
    
    const name = form.querySelector('[name=\"name\"]')?.value;
    if (!name || name.trim() === '') {
        showFieldError('createCateName', 'Tên là bắt buộc');
        return;
    }
    
    const categoryData = {
        name: name,
        description: form.querySelector('[name=\"description\"]')?.value || null,
        thumbnailUrl: form.querySelector('[name=\"thumbnailUrl\"]')?.value || null,
        isActive: true
    };

    // Show progress bar
    showUploadProgress('createCategory');
    
    try {
        // Upload deferred files
        const uploadResults = await thumbnailUploadManager.uploadDeferredFiles((progress) => {
            updateUploadProgress((progress.current / progress.total) * 100, 'createCategory');
        });
        
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            hideUploadProgress('createCategory');
            return;
        }
        
        // Update categoryData with uploaded URLs
        if (Object.keys(uploadResults.urls).length > 0) {
            const thumbnailFieldId = 'createCategoryThumbnailUrl';
            if (uploadResults.urls[`${thumbnailFieldId}File`]) {
                categoryData.thumbnailUrl = uploadResults.urls[`${thumbnailFieldId}File`];
            }
        }
        
        hideUploadProgress('createCategory');
        await cateManager.submitCreate('createCategoryForm', () => categoryData, 'createCategoryModal');
    } catch (error) {
        hideUploadProgress('createCategory');
        showNotification('Lỗi tạo category: ' + error.message, 'error');
    }
}

// INLINE EDIT
function enterCategoryEditMode(id) { cateManager.enterEditMode(id); }
function cancelCategoryEditMode(id) { cateManager.cancelEditMode(id); }

async function saveInlineCategory(id) {
    const row = cateManager.getRow(id);
    if (!row) return;
    
    const name = cateManager.getEditValue(row, 'name');
    if (!name || name.trim() === '') {
        showNotification('Tên là bắt buộc', 'error');
        return;
    }
    
    try {
        showTableLoading();
        
        // Upload deferred files first
        const uploadResults = await thumbnailUploadManager.uploadDeferredFiles();
        
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            hideTableLoading();
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            return;
        }
        
        // Build update data
        let thumbnailUrl = cateManager.getEditValue(row, 'thumbnailUrl') || null;
        
        // If new file uploaded, use the uploaded URL
        // Key format: thumbnailUrlFile{categoryId} (e.g., thumbnailUrlFile3)
        if (Object.keys(uploadResults.urls).length > 0) {
            const expectedKey = `thumbnailUrlFile${id}`;
            if (uploadResults.urls[expectedKey]) {
                thumbnailUrl = uploadResults.urls[expectedKey];
            }
        }
        
        hideTableLoading();
        
        await cateManager.saveInlineEdit(id, (row) => ({
            name: name,
            description: cateManager.getEditValue(row, 'description'),
            thumbnailUrl: thumbnailUrl,
            isActive: String(cateManager.getEditValue(row, 'isActive')) === 'true'
        }));
    } catch (error) {
        hideTableLoading();
        showNotification('Lỗi cập nhật category: ' + error.message, 'error');
    }
}

// THUMBNAIL UPLOAD
function handleThumbnailUpload(input, categoryId = null) {
    thumbnailUploadManager.handleUpload(input, categoryId);
}
