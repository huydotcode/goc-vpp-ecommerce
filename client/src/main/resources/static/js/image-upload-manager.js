/**
 * Image Upload Manager - Unified image/avatar/thumbnail upload handling
 * REFACTORED: Deferred upload - save locally, upload on form submit
 */

class ImageUploadManager {
    constructor(options = {}) {
        this.resourceType = options.resourceType || 'image'; // 'image', 'video', 'raw'
        this.module = options.module || 'shared'; // 'users', 'categories'
        this.maxSizeMB = options.maxSizeMB || 2;
        this.fieldName = options.fieldName || 'avatarUrl'; // 'avatarUrl', 'thumbnailUrl'
        this.previewSelector = options.previewSelector || '.upload-preview-container';
        
        // Store deferred file uploads: { fieldId: { file, preview } }
        this.deferredFiles = {};
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        return validateFileBeforeUpload(file, this.resourceType);
    }

    /**
     * Handle file input change - SAVE LOCALLY, DON'T UPLOAD YET
     */
    async handleUpload(input, entityId = null) {
        const file = input.files[0];
        if (!file) return;

        // Validate
        const validation = this.validateFile(file);
        if (!validation.valid) {
            showNotification(validation.message, 'error');
            input.value = '';
            return;
        }

        // Save locally - store in deferred uploads
        const fieldId = input.id || `${this.module}_${this.fieldName}_${Date.now()}`;
        this.deferredFiles[fieldId] = {
            file: file,
            entityId: entityId,
            input: input
        };

        // Show preview
        let previewContainer = this.getPreviewContainer(input, entityId);
        if (previewContainer) {
            previewImageBeforeUpload(file, previewContainer);
        }

        // Show deferred upload indicator
        this.showDeferredUploadIndicator(input, file);
        
        // Show success notification
        showNotification(`File lưu cục bộ: ${file.name}. Sẽ upload khi bạn nhấn "Thêm"`, 'info');
    }

    /**
     * Show deferred upload indicator
     */
    showDeferredUploadIndicator(input, file) {
        // Remove existing indicator
        const existing = input.parentElement?.querySelector('.deferred-upload-preview');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'deferred-upload-preview';
        indicator.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div class="deferred-upload-preview-text">
                <span class="deferred-upload-filename">${file.name}</span>
                <span class="deferred-upload-size">${(file.size / 1024).toFixed(1)} KB</span>
            </div>
        `;
        input.parentElement?.appendChild(indicator);
    }

    /**
     * Get preview container based on context
     */
    getPreviewContainer(input, entityId) {
        // For create form
        if (input.id && input.id.includes('File')) {
            const containerId = input.id.replace('File', 'PreviewContainer').replace('create', 'create');
            return document.getElementById(containerId);
        }

        // For inline edit in table row
        if (entityId) {
            const row = document.querySelector(`tr[data-user-id='${entityId}'], tr[data-cate-id='${entityId}']`);
            if (row) {
                return row.querySelector(this.previewSelector);
            }
        }

        return null;
    }

    /**
     * Upload deferred files - called from form submission
     * Returns { success: boolean, urls: { fieldId: url } }
     */
    async uploadDeferredFiles(progressCallback = null) {
        const results = { success: true, urls: {}, failed: [] };
        const fileIds = Object.keys(this.deferredFiles);

        if (fileIds.length === 0) {
            return results; // No deferred files
        }

        for (let i = 0; i < fileIds.length; i++) {
            const fieldId = fileIds[i];
            const { file, entityId, input } = this.deferredFiles[fieldId];

            try {
                // Show progress
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: fileIds.length,
                        filename: file.name,
                        fieldId: fieldId
                    });
                }

                const result = await this.uploadSingleFile(file, entityId, (progress) => {
                    // Per-file progress callback
                });

                if (result.success && result.url) {
                    results.urls[fieldId] = result.url;
                    // Update form field with uploaded URL
                    const fieldInput = document.getElementById(fieldId.replace('File', ''));
                    if (fieldInput) {
                        fieldInput.value = result.url;
                    }
                } else {
                    results.success = false;
                    results.failed.push({ fieldId, error: result.message });
                }
            } catch (error) {
                results.success = false;
                results.failed.push({ fieldId, error: error.message });
            }
        }

        // Clear deferred files after upload
        this.deferredFiles = {};
        return results;
    }

    /**
     * Upload single file to server
     */
    async uploadSingleFile(file, entityId, onProgress = null) {
        try {
            const result = await uploadFile(file, {
                resourceType: this.resourceType,
                module: this.module,
                entityId: entityId,
                purpose: this.fieldName
            }, onProgress);

            return result;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Update form/table field with uploaded URL
     */
    updateFieldWithUrl(url, entityId, input) {
        const previewContainer = this.getPreviewContainer(input, entityId);
        const fieldInputId = input.id.replace('File', '').replace('create', 'create');

        // For create form
        if (input.id && input.id.includes('File')) {
            const fieldInput = document.getElementById(fieldInputId);
            if (fieldInput) {
                fieldInput.value = url;
                if (previewContainer) {
                    const img = previewContainer.querySelector('.upload-preview-image');
                    if (img) img.src = url;
                }
            }
            return;
        }

        // For inline edit in table
        if (entityId) {
            const row = document.querySelector(`tr[data-user-id='${entityId}'], tr[data-cate-id='${entityId}']`);
            if (row) {
                const fieldInput = row.querySelector(`input[data-field='${this.fieldName}']`);
                if (fieldInput) {
                    fieldInput.value = url;
                    if (previewContainer) {
                        const img = previewContainer.querySelector('.upload-preview-image');
                        if (img) img.src = url;
                    }
                }
            }
        }
    }
}
