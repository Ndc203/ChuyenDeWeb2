/**
 * CSRF Protection Utility
 * 
 * Cung cấp các hàm tiện ích để xử lý CSRF token
 * - Lấy CSRF token từ server
 * - Cache CSRF token trong memory và localStorage
 * - Tự động refresh token khi hết hạn
 * - Thêm CSRF token vào headers của request
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_EXPIRES_KEY = 'csrf_expires_at';
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * CSRF Token Manager
 */
class CsrfTokenManager {
    constructor() {
        this.token = null;
        this.expiresAt = null;
        this.refreshPromise = null;
    }

    /**
     * Lấy CSRF token từ cache hoặc server
     */
    async getToken() {
        // Kiểm tra token trong memory
        if (this.token && this.isTokenValid()) {
            return this.token;
        }

        // Kiểm tra token trong localStorage
        const cachedToken = localStorage.getItem(CSRF_TOKEN_KEY);
        const cachedExpiry = localStorage.getItem(CSRF_EXPIRES_KEY);

        if (cachedToken && cachedExpiry) {
            const expiryDate = new Date(cachedExpiry);
            if (expiryDate > new Date()) {
                this.token = cachedToken;
                this.expiresAt = expiryDate;
                return this.token;
            }
        }

        // Fetch token mới từ server
        return await this.fetchToken();
    }

    /**
     * Fetch CSRF token từ server
     */
    async fetchToken() {
        // Nếu đang có request fetch token, đợi request đó
        if (this.refreshPromise) {
            return await this.refreshPromise;
        }

        this.refreshPromise = fetch(`${API_BASE_URL}/csrf-token`, {
            method: 'GET',
            credentials: 'include', // Quan trọng: gửi cookies
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch CSRF token');
                }
                return response.json();
            })
            .then(data => {
                this.token = data.csrf_token;
                this.expiresAt = new Date(data.expires_at);

                // Lưu vào localStorage
                localStorage.setItem(CSRF_TOKEN_KEY, this.token);
                localStorage.setItem(CSRF_EXPIRES_KEY, this.expiresAt.toISOString());

                return this.token;
            })
            .catch(error => {
                console.error('Error fetching CSRF token:', error);
                throw error;
            })
            .finally(() => {
                this.refreshPromise = null;
            });

        return await this.refreshPromise;
    }

    /**
     * Làm mới CSRF token
     */
    async refreshToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/csrf-token/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to refresh CSRF token');
            }

            const data = await response.json();
            this.token = data.csrf_token;
            this.expiresAt = new Date(data.expires_at);

            // Lưu vào localStorage
            localStorage.setItem(CSRF_TOKEN_KEY, this.token);
            localStorage.setItem(CSRF_EXPIRES_KEY, this.expiresAt.toISOString());

            return this.token;
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra token có còn hợp lệ không
     */
    isTokenValid() {
        if (!this.token || !this.expiresAt) {
            return false;
        }

        // Kiểm tra token có hết hạn không (với buffer 5 phút)
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        return new Date().getTime() < (this.expiresAt.getTime() - bufferTime);
    }

    /**
     * Clear token cache
     */
    clearToken() {
        this.token = null;
        this.expiresAt = null;
        localStorage.removeItem(CSRF_TOKEN_KEY);
        localStorage.removeItem(CSRF_EXPIRES_KEY);
    }

    /**
     * Verify token với server
     */
    async verifyToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/csrf-token/verify`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.valid === true;
        } catch (error) {
            console.error('Error verifying CSRF token:', error);
            return false;
        }
    }
}

// Export singleton instance
export const csrfTokenManager = new CsrfTokenManager();

/**
 * Lấy CSRF token
 */
export const getCsrfToken = async () => {
    return await csrfTokenManager.getToken();
};

/**
 * Làm mới CSRF token
 */
export const refreshCsrfToken = async () => {
    return await csrfTokenManager.refreshToken();
};

/**
 * Clear CSRF token cache
 */
export const clearCsrfToken = () => {
    csrfTokenManager.clearToken();
};

/**
 * Verify CSRF token
 */
export const verifyCsrfToken = async (token) => {
    return await csrfTokenManager.verifyToken(token);
};

/**
 * Tạo headers có CSRF token cho fetch request
 */
export const createCsrfHeaders = async (additionalHeaders = {}) => {
    const token = await getCsrfToken();
    
    return {
        'X-CSRF-TOKEN': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...additionalHeaders,
    };
};

/**
 * Wrapper cho fetch với CSRF protection
 */
export const csrfFetch = async (url, options = {}) => {
    const token = await getCsrfToken();
    
    const headers = {
        'X-CSRF-TOKEN': token,
        'Accept': 'application/json',
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        credentials: 'include', // Quan trọng: gửi cookies
        headers,
    });
};

/**
 * Handle CSRF token mismatch error
 * Tự động refresh token và retry request
 */
export const handleCsrfError = async (error, retryFn) => {
    if (error.status === 419 || error.message?.includes('CSRF')) {
        console.warn('CSRF token mismatch, refreshing token...');
        
        try {
            await refreshCsrfToken();
            
            // Retry request với token mới
            if (typeof retryFn === 'function') {
                return await retryFn();
            }
        } catch (refreshError) {
            console.error('Failed to refresh CSRF token:', refreshError);
            throw refreshError;
        }
    }
    
    throw error;
};

export default {
    getCsrfToken,
    refreshCsrfToken,
    clearCsrfToken,
    verifyCsrfToken,
    createCsrfHeaders,
    csrfFetch,
    handleCsrfError,
    csrfTokenManager,
};
