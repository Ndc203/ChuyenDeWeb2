import axios from 'axios';
import { getCsrfToken, refreshCsrfToken, handleCsrfError } from './csrfProtection';

/**
 * Axios Configuration với CSRF Protection
 * 
 * Tự động thêm CSRF token vào mọi request
 * Tự động xử lý CSRF token mismatch và retry
 */

// Tạo axios instance
const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    withCredentials: true, // Quan trọng: gửi cookies với mọi request
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * Request Interceptor
 * Tự động thêm CSRF token vào header của mọi request
 */
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            // Chỉ thêm CSRF token cho các phương thức thay đổi dữ liệu
            const methodsRequiringCsrf = ['post', 'put', 'patch', 'delete'];
            
            if (methodsRequiringCsrf.includes(config.method.toLowerCase())) {
                const token = await getCsrfToken();
                config.headers['X-CSRF-TOKEN'] = token;
            }

            return config;
        } catch (error) {
            console.error('Error adding CSRF token to request:', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Tự động xử lý CSRF token mismatch (419 error)
 */
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu là CSRF token mismatch (419 error)
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.warn('CSRF token mismatch detected, refreshing token...');
                
                // Refresh CSRF token
                const newToken = await refreshCsrfToken();
                
                // Cập nhật token trong request gốc
                originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                
                // Retry request với token mới
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('Failed to refresh CSRF token:', refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Helper functions để sử dụng axios instance dễ dàng hơn
 */

export const api = {
    /**
     * GET request
     */
    get: (url, config = {}) => {
        return axiosInstance.get(url, config);
    },

    /**
     * POST request với CSRF protection
     */
    post: (url, data = {}, config = {}) => {
        return axiosInstance.post(url, data, config);
    },

    /**
     * PUT request với CSRF protection
     */
    put: (url, data = {}, config = {}) => {
        return axiosInstance.put(url, data, config);
    },

    /**
     * PATCH request với CSRF protection
     */
    patch: (url, data = {}, config = {}) => {
        return axiosInstance.patch(url, data, config);
    },

    /**
     * DELETE request với CSRF protection
     */
    delete: (url, config = {}) => {
        return axiosInstance.delete(url, config);
    },
};

/**
 * Wrapper functions để backward compatibility với code cũ
 */

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const del = api.delete;

export default axiosInstance;
