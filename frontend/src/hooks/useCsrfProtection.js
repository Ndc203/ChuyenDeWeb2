import { useState, useEffect, useCallback } from 'react';
import {
    getCsrfToken,
    refreshCsrfToken,
    clearCsrfToken,
    verifyCsrfToken,
    createCsrfHeaders,
    csrfFetch,
    handleCsrfError,
} from '../utils/csrfProtection';

/**
 * React Hook for CSRF Protection
 * 
 * Sử dụng:
 * const { token, loading, error, refresh, clear, fetchWithCsrf } = useCsrfProtection();
 */
export const useCsrfProtection = () => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Load CSRF token khi component mount
     */
    useEffect(() => {
        const loadToken = async () => {
            try {
                setLoading(true);
                setError(null);
                const csrfToken = await getCsrfToken();
                setToken(csrfToken);
            } catch (err) {
                setError(err.message || 'Failed to load CSRF token');
                console.error('Error loading CSRF token:', err);
            } finally {
                setLoading(false);
            }
        };

        loadToken();
    }, []);

    /**
     * Refresh CSRF token
     */
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const newToken = await refreshCsrfToken();
            setToken(newToken);
            return newToken;
        } catch (err) {
            setError(err.message || 'Failed to refresh CSRF token');
            console.error('Error refreshing CSRF token:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear CSRF token
     */
    const clear = useCallback(() => {
        clearCsrfToken();
        setToken(null);
    }, []);

    /**
     * Verify CSRF token
     */
    const verify = useCallback(async (tokenToVerify = null) => {
        try {
            const tokenValue = tokenToVerify || token;
            if (!tokenValue) {
                return false;
            }
            return await verifyCsrfToken(tokenValue);
        } catch (err) {
            console.error('Error verifying CSRF token:', err);
            return false;
        }
    }, [token]);

    /**
     * Fetch với CSRF protection
     */
    const fetchWithCsrf = useCallback(async (url, options = {}) => {
        try {
            return await csrfFetch(url, options);
        } catch (err) {
            // Xử lý CSRF error và retry
            return await handleCsrfError(err, () => csrfFetch(url, options));
        }
    }, []);

    /**
     * Tạo headers với CSRF token
     */
    const getHeaders = useCallback(async (additionalHeaders = {}) => {
        return await createCsrfHeaders(additionalHeaders);
    }, []);

    return {
        token,
        loading,
        error,
        refresh,
        clear,
        verify,
        fetchWithCsrf,
        getHeaders,
    };
};

/**
 * Hook đơn giản chỉ để lấy CSRF token
 */
export const useCsrfToken = () => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        getCsrfToken().then(setToken).catch(console.error);
    }, []);

    return token;
};

/**
 * Hook để tự động thêm CSRF token vào fetch options
 * 
 * Sử dụng:
 * const fetchOptions = useCsrfFetchOptions({ method: 'POST', body: data });
 */
export const useCsrfFetchOptions = (baseOptions = {}) => {
    const [options, setOptions] = useState(baseOptions);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const addCsrfToOptions = async () => {
            try {
                setLoading(true);
                const headers = await createCsrfHeaders(baseOptions.headers);
                setOptions({
                    ...baseOptions,
                    credentials: 'include',
                    headers,
                });
            } catch (err) {
                console.error('Error adding CSRF to fetch options:', err);
            } finally {
                setLoading(false);
            }
        };

        addCsrfToOptions();
    }, [JSON.stringify(baseOptions)]);

    return { options, loading };
};

/**
 * Hook để handle CSRF protected form submission
 * 
 * Sử dụng:
 * const { submit, loading, error } = useCsrfForm();
 * 
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   await submit('/api/endpoint', { method: 'POST', body: formData });
 * };
 */
export const useCsrfForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);

    const submit = useCallback(async (url, options = {}) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const result = await csrfFetch(url, options);
            
            if (!result.ok) {
                throw new Error(`HTTP ${result.status}: ${result.statusText}`);
            }

            const data = await result.json();
            setResponse(data);
            return data;
        } catch (err) {
            // Nếu là CSRF error, tự động refresh token và retry
            if (err.status === 419 || err.message?.includes('CSRF')) {
                try {
                    await refreshCsrfToken();
                    const retryResult = await csrfFetch(url, options);
                    const data = await retryResult.json();
                    setResponse(data);
                    return data;
                } catch (retryErr) {
                    setError(retryErr.message || 'Request failed after token refresh');
                    throw retryErr;
                }
            }

            setError(err.message || 'Request failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setResponse(null);
        setLoading(false);
    }, []);

    return {
        submit,
        loading,
        error,
        response,
        reset,
    };
};

export default useCsrfProtection;
