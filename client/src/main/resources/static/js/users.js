/**
 * Users Management - Logic cho trang quản lý users (Refactored)
 */

// Initialize managers
const userManager = new EntityManager('users', `${BACKEND_URL}/users`, 'data-user-id');
const avatarUploadManager = new ImageUploadManager({
    resourceType: 'image',
    module: 'users',
    fieldName: 'avatarUrl'
});

// PAGE SETUP
window.addEventListener('load', function() {
    setupFilterAndPaginationListeners();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        showNotification('Tải dữ liệu thành công!', 'success');
    }
});

function setupFilterAndPaginationListeners() {
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFilterWithLoading();
        });
    }
}

// FILTER
function submitFilterWithLoading() {
    showContainerLoading('Đang lọc dữ liệu...');
    const url = new URL(window.location);
    url.searchParams.delete('id');
    url.searchParams.delete('role');
    url.searchParams.delete('username');
    url.searchParams.delete('email');
    url.searchParams.delete('isActive');
    url.searchParams.delete('search');
    url.searchParams.delete('page');
    
    const id = document.getElementById('id')?.value || '';
    const role = document.getElementById('role')?.value || '';
    const username = document.getElementById('username')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const isActive = document.getElementById('isActive')?.value || '';
    const search = document.getElementById('search')?.value || '';
    
    // ID filter takes absolute priority
    if (id.trim() !== '') url.searchParams.set('id', id.trim());
    if (role !== '') url.searchParams.set('role', role);
    if (username.trim() !== '') url.searchParams.set('username', username.trim());
    if (email.trim() !== '') url.searchParams.set('email', email.trim());
    if (isActive !== '') url.searchParams.set('isActive', isActive);
    if (search.trim() !== '') url.searchParams.set('search', search.trim());
    
    window.location.href = url.toString();
}

function resetAllFilters() {
    showContainerLoading('Đang xóa bộ lọc...');
    window.location.href = window.location.pathname;
}

// VIEW
async function viewUser(id) {
    try {
        showTableLoading();
        const user = await userManager.fetchById(id);
        if (user) {
            populateViewModal(user);
            openDrawer('userDrawer');
        }
    } finally {
        hideTableLoading();
    }
}

function populateViewModal(user) {
    document.getElementById('viewId').textContent = user.id || '-';
    document.getElementById('viewUsername').textContent = user.username || '-';
    document.getElementById('viewEmail').textContent = user.email || '-';
    document.getElementById('viewRole').textContent = user.role || '-';
    document.getElementById('viewIsActive').textContent = user.isActive ? 'Active' : 'Inactive';
    document.getElementById('viewCreatedAt').textContent = formatDate(user.createdAt) || '-';
    document.getElementById('viewUpdatedAt').textContent = formatDate(user.updatedAt) || '-';
    document.getElementById('viewCreatedBy').textContent = user.createdBy || '-';
    document.getElementById('viewUpdatedBy').textContent = user.updatedBy || '-';
    
    const viewAvatar = document.getElementById('viewAvatar');
    if (viewAvatar) {
        viewAvatar.style.display = user.avatarUrl ? 'block' : 'none';
        if (user.avatarUrl) viewAvatar.src = user.avatarUrl;
    }
}

// CREATE
function showCreateModal() {
    clearCreateForm();
    showModal('createModal');
}

function clearCreateForm() {
    const form = document.getElementById('createUserForm');
    if (form) form.reset();
    const isActiveCheckbox = document.getElementById('createIsActive');
    if (isActiveCheckbox) isActiveCheckbox.checked = true;
    clearFieldErrors('createUserForm');
}

async function submitCreateUser() {
    const form = document.getElementById('createUserForm');
    if (!form) return;
    
    const userData = {
        username: form.querySelector('[name="username"]')?.value,
        email: form.querySelector('[name="email"]')?.value,
        password: form.querySelector('[name="password"]')?.value,
        role: form.querySelector('[name="role"]')?.value,
        isActive: form.querySelector('[name="isActive"]')?.checked ?? true,
        avatarUrl: form.querySelector('[name="avatarUrl"]')?.value || null
    };
    
    if (!validateCreateUserForm(userData)) return;
    
    // Show progress bar
    showUploadProgress('create');
    
    try {
        // Upload deferred files
        const uploadResults = await avatarUploadManager.uploadDeferredFiles((progress) => {
            updateUploadProgress((progress.current / progress.total) * 100, 'create');
        });
        
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            hideUploadProgress('create');
            return;
        }
        
        // Update userData with uploaded URLs
        if (Object.keys(uploadResults.urls).length > 0) {
            const avatarFieldId = 'createAvatarUrl';
            if (uploadResults.urls[`${avatarFieldId}File`]) {
                userData.avatarUrl = uploadResults.urls[`${avatarFieldId}File`];
            }
        }
        
        hideUploadProgress('create');
        await userManager.submitCreate('createUserForm', () => userData, 'createModal');
    } catch (error) {
        hideUploadProgress('create');
        showNotification('Lỗi tạo user: ' + error.message, 'error');
    }
}

function validateCreateUserForm(data) {
    let isValid = true;
    clearFieldErrors('createUserForm');
    if (!data.username?.trim()) { showFieldError('createUsername', 'Username là bắt buộc'); isValid = false; }
    if (!data.email?.trim()) { showFieldError('createEmail', 'Email là bắt buộc'); isValid = false; }
    else if (!isValidEmail(data.email)) { showFieldError('createEmail', 'Email không hợp lệ'); isValid = false; }
    if (!data.password?.trim()) { showFieldError('createPassword', 'Password là bắt buộc'); isValid = false; }
    else if (data.password.length < 6) { showFieldError('createPassword', 'Password phải có ít nhất 6 ký tự'); isValid = false; }
    if (!data.role?.trim()) { showFieldError('createRole', 'Role là bắt buộc'); isValid = false; }
    if (!isValid) showNotification('Vui lòng nhập đủ thông tin bắt buộc', 'error');
    return isValid;
}

// INLINE EDIT
function enterUserEditMode(id) { userManager.enterEditMode(id); }
function cancelUserEditMode(id) { userManager.cancelEditMode(id); }

async function saveInlineUser(id) {
    const row = userManager.getRow(id);
    if (!row) return;
    const username = userManager.getEditValue(row, 'username');
    const email = userManager.getEditValue(row, 'email');
    const role = userManager.getEditValue(row, 'role');
    if (!username?.trim()) { showNotification('Username là bắt buộc', 'error'); return; }
    if (!email?.trim()) { showNotification('Email là bắt buộc', 'error'); return; }
    if (!role?.trim()) { showNotification('Role là bắt buộc', 'error'); return; }
    
    try {
        showTableLoading();
        
        // Upload deferred files first
        const uploadResults = await avatarUploadManager.uploadDeferredFiles();
        
        if (!uploadResults.success && uploadResults.failed.length > 0) {
            hideTableLoading();
            showNotification(`Lỗi upload: ${uploadResults.failed[0].error}`, 'error');
            return;
        }
        
        // Build update data
        let avatarUrl = userManager.getEditValue(row, 'avatarUrl') || null;
        
        // If new file uploaded, use the uploaded URL
        // Key format: avatarUrlFile{userId} (e.g., avatarUrlFile1)
        if (Object.keys(uploadResults.urls).length > 0) {
            const expectedKey = `avatarUrlFile${id}`;
            if (uploadResults.urls[expectedKey]) {
                avatarUrl = uploadResults.urls[expectedKey];
            }
        }
        
        hideTableLoading();
        
        await userManager.saveInlineEdit(id, (row) => ({
            id, username, email, password: null, role,
            isActive: String(userManager.getEditValue(row, 'isActive')) === 'true',
            avatarUrl: avatarUrl
        }));
    } catch (error) {
        hideTableLoading();
        showNotification('Lỗi cập nhật user: ' + error.message, 'error');
    }
}

// AVATAR UPLOAD
function handleAvatarUpload(input, userId = null) {
    avatarUploadManager.handleUpload(input, userId);
}
