import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content để ngăn chặn XSS attacks
 * @param {string} html - HTML content cần sanitize
 * @param {object} config - DOMPurify configuration options
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html, config = {}) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return DOMPurify.sanitize(html, mergedConfig);
};

/**
 * Sanitize text - loại bỏ tất cả HTML tags
 * @param {string} text - Text cần sanitize
 * @returns {string} - Plain text without HTML
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Loại bỏ tất cả HTML tags
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Escape HTML special characters
 * @param {string} text - Text cần escape
 * @returns {string} - Escaped text
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize URL để ngăn chặn javascript: và data: URIs
 * @param {string} url - URL cần sanitize
 * @returns {string} - Safe URL hoặc empty string
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Loại bỏ whitespace
  url = url.trim();

  // Kiểm tra protocol nguy hiểm
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Chỉ cho phép http, https, mailto, tel, và relative URLs
  if (!/^(https?:\/\/|mailto:|tel:|\/|\.\/|#)/.test(url)) {
    return '';
  }

  return url;
};

/**
 * Sanitize attribute value
 * @param {string} value - Attribute value
 * @returns {string} - Sanitized value
 */
export const sanitizeAttribute = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Loại bỏ javascript: và on* event handlers
  return value
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Kiểm tra xem string có chứa potential XSS không
 * @param {string} input - Input cần kiểm tra
 * @returns {boolean} - true nếu có potential XSS
 */
export const containsXss = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize object - áp dụng sanitize cho tất cả string values
 * @param {object} obj - Object cần sanitize
 * @param {function} sanitizer - Function sanitize (mặc định: sanitizeText)
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj, sanitizer = sanitizeText) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizer(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, sanitizer);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Hook để sanitize form input
 * @param {string} value - Input value
 * @param {string} type - Type of sanitization ('text', 'html', 'url')
 * @returns {string} - Sanitized value
 */
export const useSanitizedInput = (value, type = 'text') => {
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
};

/**
 * Component wrapper để hiển thị HTML đã sanitize
 * Usage: <SafeHtml html={content} />
 */
export const SafeHtml = ({ html, className = '', config = {} }) => {
  const sanitized = sanitizeHtml(html, config);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

/**
 * Configure DOMPurify với custom hooks
 */
export const configureDOMPurify = () => {
  // Hook để log các potential XSS attempts
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'script') {
      console.warn('XSS attempt detected: script tag blocked');
    }
  });

  // Hook để xử lý các attribute nguy hiểm
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName && data.attrName.startsWith('on')) {
      console.warn(`XSS attempt detected: ${data.attrName} attribute blocked`);
    }
  });
};

// Initialize DOMPurify configuration khi module được load
configureDOMPurify();

export default {
  sanitizeHtml,
  sanitizeText,
  escapeHtml,
  sanitizeUrl,
  sanitizeAttribute,
  containsXss,
  sanitizeObject,
  useSanitizedInput,
  SafeHtml,
  configureDOMPurify,
};
