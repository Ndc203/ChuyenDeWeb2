import { useState, useCallback, useEffect, useMemo } from 'react';
import { sanitizeText, sanitizeHtml, sanitizeUrl, containsXss } from '../utils/xssProtection';

/**
 * Hook để sanitize input value tự động
 * @param {string} initialValue - Giá trị khởi tạo
 * @param {string} type - Loại sanitization ('text', 'html', 'url')
 * @returns {Array} [value, setValue, sanitizedValue]
 */
export const useSanitizedInput = (initialValue = '', type = 'text') => {
  const [value, setValue] = useState(initialValue);

  const sanitizedValue = useMemo(() => {
    if (!value) return '';

    switch (type) {
      case 'html':
        return sanitizeHtml(value);
      case 'url':
        return sanitizeUrl(value);
      case 'text':
      default:
        return sanitizeText(value);
    }
  }, [value, type]);

  return [value, setValue, sanitizedValue];
};

/**
 * Hook để validate và sanitize form data
 * @param {object} initialData - Dữ liệu form ban đầu
 * @param {object} sanitizeRules - Rules cho từng field
 * @returns {object} Form utilities
 */
export const useSanitizedForm = (initialData = {}, sanitizeRules = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((name) => {
    const value = formData[name];
    const rule = sanitizeRules[name];

    // Check for XSS
    if (value && typeof value === 'string' && containsXss(value)) {
      setErrors(prev => ({
        ...prev,
        [name]: 'Nội dung không hợp lệ (chứa mã nguy hiểm)'
      }));
    }

    // Apply sanitization rule if exists
    if (rule && value) {
      let sanitizedValue = value;
      
      switch (rule) {
        case 'html':
          sanitizedValue = sanitizeHtml(value);
          break;
        case 'url':
          sanitizedValue = sanitizeUrl(value);
          break;
        case 'text':
        default:
          sanitizedValue = sanitizeText(value);
          break;
      }

      if (sanitizedValue !== value) {
        setFormData(prev => ({
          ...prev,
          [name]: sanitizedValue
        }));
      }
    }
  }, [formData, sanitizeRules]);

  const getSanitizedData = useCallback(() => {
    const sanitized = {};

    Object.keys(formData).forEach(key => {
      const value = formData[key];
      const rule = sanitizeRules[key] || 'text';

      if (typeof value === 'string') {
        switch (rule) {
          case 'html':
            sanitized[key] = sanitizeHtml(value);
            break;
          case 'url':
            sanitized[key] = sanitizeUrl(value);
            break;
          case 'text':
          default:
            sanitized[key] = sanitizeText(value);
            break;
        }
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }, [formData, sanitizeRules]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    formData,
    setFormData,
    handleChange,
    handleBlur,
    getSanitizedData,
    errors,
    setErrors,
    hasErrors,
    reset
  };
};

/**
 * Hook để check XSS trong real-time
 * @param {string} value - Giá trị cần check
 * @returns {object} { hasXss, message }
 */
export const useXssCheck = (value) => {
  const [result, setResult] = useState({ hasXss: false, message: '' });

  useEffect(() => {
    if (!value || typeof value !== 'string') {
      setResult({ hasXss: false, message: '' });
      return;
    }

    const hasXss = containsXss(value);
    
    setResult({
      hasXss,
      message: hasXss ? 'Cảnh báo: Nội dung có thể chứa mã nguy hiểm' : ''
    });
  }, [value]);

  return result;
};

/**
 * Hook để sanitize data khi fetch từ API
 * @param {function} fetchFunction - Function để fetch data
 * @param {object} sanitizeConfig - Configuration cho sanitization
 * @returns {object} { data, loading, error, refetch }
 */
export const useSanitizedFetch = (fetchFunction, sanitizeConfig = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sanitizeData = useCallback((rawData) => {
    if (!rawData) return rawData;

    if (Array.isArray(rawData)) {
      return rawData.map(item => sanitizeData(item));
    }

    if (typeof rawData === 'object') {
      const sanitized = {};
      
      Object.keys(rawData).forEach(key => {
        const value = rawData[key];
        const rule = sanitizeConfig[key];

        if (typeof value === 'string' && rule) {
          switch (rule) {
            case 'html':
              sanitized[key] = sanitizeHtml(value);
              break;
            case 'url':
              sanitized[key] = sanitizeUrl(value);
              break;
            case 'text':
              sanitized[key] = sanitizeText(value);
              break;
            default:
              sanitized[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      });

      return sanitized;
    }

    return rawData;
  }, [sanitizeConfig]);

  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(...args);
      const sanitized = sanitizeData(result);
      setData(sanitized);
      return sanitized;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, sanitizeData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook để tự động sanitize clipboard data
 * @returns {function} handlePaste
 */
export const useSanitizedPaste = () => {
  const handlePaste = useCallback((event, type = 'text') => {
    event.preventDefault();
    
    const pastedData = event.clipboardData.getData('text');
    let sanitized = '';

    switch (type) {
      case 'html':
        sanitized = sanitizeHtml(pastedData);
        break;
      case 'url':
        sanitized = sanitizeUrl(pastedData);
        break;
      case 'text':
      default:
        sanitized = sanitizeText(pastedData);
        break;
    }

    // Insert sanitized content
    const target = event.target;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    target.value = value.substring(0, start) + sanitized + value.substring(end);
    target.selectionStart = target.selectionEnd = start + sanitized.length;

    // Trigger change event
    const changeEvent = new Event('input', { bubbles: true });
    target.dispatchEvent(changeEvent);

    return sanitized;
  }, []);

  return handlePaste;
};

export default {
  useSanitizedInput,
  useSanitizedForm,
  useXssCheck,
  useSanitizedFetch,
  useSanitizedPaste
};
