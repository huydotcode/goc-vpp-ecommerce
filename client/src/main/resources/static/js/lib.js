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

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target.id);
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
        overlay.style.display = 'flex';
    }
}

function hideTableLoading() {
    const overlay = document.getElementById('tableLoadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
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

window.addEventListener('load', function() {
    setupDragAndDrop();
    setupImageClickHandlers();
});
