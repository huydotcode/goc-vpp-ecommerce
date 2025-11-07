/**
 * API Utility - Hàm chung để gọi API
 */

// Get backend base URL from window or use default
const BACKEND_URL = (() => {
    // Check if set globally (e.g., from server-rendered HTML)
    if (window.BACKEND_URL) {
        return window.BACKEND_URL;
    }
    // Default to localhost:8080 with /api/v1 context path
    return 'http://localhost:8080/api/v1';
})();

// Lấy token từ localStorage, cookie, hoặc session
async function getToken() {
    // Try localStorage first
    let token = localStorage.getItem('access_token');
    if (token) {
        return token;
    }
    
    // Try cookie
    token = getCookie('access_token');
    if (token) {
        return token;
    }
    
    // Try to get from session via API
    try {
        const response = await fetch(`${BACKEND_URL}/auth/token`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            if (token) {
                localStorage.setItem('access_token', token);
                return token;
            }
        }
    } catch (error) {
        // Silent fail
    }
    
    return null;
}

// Lấy cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Validate file trước upload
function validateFileBeforeUpload(file, resourceType = 'image') {
    if (!file) {
        return { valid: false, message: 'Vui lòng chọn file' };
    }
    
    // File size limits (in bytes)
    const limits = {
        'image': 5 * 1024 * 1024,    // 5MB
        'video': 50 * 1024 * 1024,   // 50MB
        'raw': 10 * 1024 * 1024      // 10MB
    };
    
    // Allowed formats
    const formats = {
        'image': ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        'video': ['mp4', 'webm'],
        'raw': ['pdf', 'docx', 'zip']
    };
    
    const maxSize = limits[resourceType] || limits['raw'];
    const allowedFormats = formats[resourceType] || [];
    
    // Get file extension
    const filename = file.name || '';
    const ext = filename.includes('.') 
        ? filename.split('.').pop().toLowerCase() 
        : '';
    
    // Validate extension
    if (!ext || !allowedFormats.includes(ext)) {
        return {
            valid: false,
            message: `Định dạng file không được hỗ trợ. Hãy dùng: ${allowedFormats.join(', ')}`
        };
    }
    
    // Validate size
    if (file.size > maxSize) {
        const maxMB = Math.floor(maxSize / (1024 * 1024));
        return {
            valid: false,
            message: `Kích thước file vượt quá ${maxMB}MB`
        };
    }
    
    return { valid: true };
}

// Upload file with progress tracking
async function uploadFile(file, options = {}, onProgress = null) {
    const {
        resourceType = 'image',
        module = 'shared',
        entityId = null,
        purpose = 'file'
    } = options;
    
    // Validate file before upload
    const validation = validateFileBeforeUpload(file, resourceType);
    if (!validation.valid) {
        return {
            success: false,
            message: validation.message
        };
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resourceType', resourceType);
        formData.append('module', module);
        if (entityId) {
            formData.append('entityId', entityId);
        }
        formData.append('purpose', purpose);
        
        const token = await getToken();
        
        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress({
                        percent: percentComplete,
                        loaded: event.loaded,
                        total: event.total
                    });
                }
            });
            
            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.status === 'success' || xhr.status === 200) {
                            resolve({
                                success: true,
                                url: result.data?.secureUrl || result.data?.secure_url,
                                data: result.data
                            });
                        } else {
                            reject({
                                success: false,
                                message: result.message || 'Upload thất bại'
                            });
                        }
                    } catch (e) {
                        reject({
                            success: false,
                            message: 'Lỗi phân tích phản hồi từ server'
                        });
                    }
                } else {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        reject({
                            success: false,
                            message: result.message || `Upload thất bại (${xhr.status})`
                        });
                    } catch (e) {
                        reject({
                            success: false,
                            message: `Upload thất bại (${xhr.status})`
                        });
                    }
                }
            });
            
            // Handle errors
            xhr.addEventListener('error', () => {
                reject({
                    success: false,
                    message: 'Lỗi khi kết nối đến server'
                });
            });
            
            xhr.addEventListener('abort', () => {
                reject({
                    success: false,
                    message: 'Upload bị hủy'
                });
            });
            
            // Start request
            xhr.open('POST', `${BACKEND_URL}/uploads`);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            message: error.message || 'Upload thất bại'
        };
    }
}

// Gọi API với token
async function apiCall(url, options = {}) {
    const {
        method = 'GET',
        body = null,
        headers = {}
    } = options;
    
    const token = await getToken();
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers: {
            ...defaultHeaders,
            ...headers
        }
    };
    
    if (body && method !== 'GET') {
        config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('API call error:', error);
        return {
            ok: false,
            status: 0,
            error: error.message
        };
    }
}

