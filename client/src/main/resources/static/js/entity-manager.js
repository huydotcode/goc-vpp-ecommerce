/**
 * Entity Manager Base Class - Generic CRUD operations for any entity
 */

class EntityManager {
    constructor(entityName, apiBaseUrl, dataAttribute) {
        this.entityName = entityName; // 'users' or 'categories'
        this.apiBaseUrl = apiBaseUrl; // 'http://localhost:8080/api/v1/users'
        this.dataAttribute = dataAttribute; // 'data-user-id' or 'data-cate-id'
        this.isUpdating = false;
        this.isSubmitting = false;
    }

    /**
     * Get edit value from row
     */
    getEditValue(row, field) {
        const el = row.querySelector(`.cell-edit input[data-field='${field}'], .cell-edit select[data-field='${field}']`);
        if (el) return el.value;
        
        const el2 = row.querySelector(`.cell-edit[data-field='${field}']`);
        return el2 ? el2.value : null;
    }

    /**
     * Enter edit mode for a row
     */
    enterEditMode(id) {
        const row = document.querySelector(`tr[${this.dataAttribute}='${id}']`);
        if (!row) return;
        
        row.querySelectorAll('.cell-view').forEach(el => el.style.display = 'none');
        row.querySelectorAll('.cell-edit').forEach(el => el.style.display = '');
    }

    /**
     * Cancel edit mode for a row
     */
    cancelEditMode(id) {
        const row = document.querySelector(`tr[${this.dataAttribute}='${id}']`);
        if (!row) return;
        
        row.querySelectorAll('.cell-edit').forEach(el => el.style.display = 'none');
        row.querySelectorAll('.cell-view').forEach(el => el.style.display = '');
    }

    /**
     * Get row element by ID
     */
    getRow(id) {
        return document.querySelector(`tr[${this.dataAttribute}='${id}']`);
    }

    /**
     * Disable row edit controls
     */
    disableRowEdit(row, disable = true) {
        const saveBtn = row.querySelector('.cell-edit .btn.btn-success');
        const cancelBtn = row.querySelector('.cell-edit .btn.btn-secondary');
        
        if (saveBtn) saveBtn.disabled = disable;
        if (cancelBtn) cancelBtn.disabled = disable;
        
        row.querySelectorAll('.cell-edit input, .cell-edit select').forEach(el => el.disabled = disable);
    }

    /**
     * Disable form controls
     */
    disableFormControls(formId, disable = true) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const btns = form.querySelectorAll('.btn');
        btns.forEach(btn => btn.disabled = disable);
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.disabled = disable);
    }

    /**
     * Save inline edit
     */
    async saveInlineEdit(id, dataExtractor) {
        const row = this.getRow(id);
        if (!row || this.isUpdating) return;

        // dataExtractor is a function that extracts data from row
        // e.g., (row) => ({ username: this.getEditValue(row, 'username'), email: this.getEditValue(row, 'email') })
        const data = dataExtractor(row);

        try {
            showTableLoading();
            this.isUpdating = true;
            this.disableRowEdit(row, true);

            const result = await apiCall(`${this.apiBaseUrl}/${id}`, {
                method: 'PUT',
                body: data
            });

            if (result.ok && result.data.status === 'success') {
                showNotification(`Cập nhật ${this.entityName} thành công!`, 'success');
                setTimeout(() => {
                    window.location.href = window.location.href;
                }, 400);
            } else {
                const err = result.data || {};
                showNotification(err.message || `Lỗi khi cập nhật ${this.entityName}`, 'error');
            }
        } catch (e) {
            console.error('Inline update error:', e);
            showNotification(`Lỗi khi cập nhật ${this.entityName}`, 'error');
        } finally {
            hideTableLoading();
            this.isUpdating = false;
            this.disableRowEdit(row, false);
        }
    }

    /**
     * Submit create form
     */
    async submitCreate(formId, dataExtractor, modalId) {
        if (this.isSubmitting) return;

        const form = document.getElementById(formId);
        if (!form) return;

        // dataExtractor is a function that extracts data from form
        const data = dataExtractor(form);

        this.disableFormControls(formId, true);

        try {
            showTableLoading();
            this.isSubmitting = true;

            const result = await apiCall(this.apiBaseUrl, {
                method: 'POST',
                body: data
            });

            if (result.ok && result.data.status === 'success') {
                showNotification(`Tạo ${this.entityName} thành công!`, 'success');
                if (modalId) closeModal(modalId);
                setTimeout(() => {
                    window.location.href = window.location.href;
                }, 500);
            } else {
                showNotification(result.data.message || `Lỗi khi tạo ${this.entityName}`, 'error');
            }
        } catch (error) {
            console.error('Create error:', error);
            showNotification(`Lỗi khi tạo ${this.entityName}`, 'error');
        } finally {
            hideTableLoading();
            this.isSubmitting = false;
            this.disableFormControls(formId, false);
        }
    }

    /**
     * Fetch entity by ID
     */
    async fetchById(id) {
        try {
            const result = await apiCall(`${this.apiBaseUrl}/${id}`, {
                method: 'GET'
            });

            if (result.ok && result.data.status === 'success') {
                return result.data.data;
            } else {
                showNotification(`Không thể tải thông tin ${this.entityName}`, 'error');
                return null;
            }
        } catch (error) {
            showNotification(`Lỗi khi tải thông tin ${this.entityName}`, 'error');
            return null;
        }
    }
}
