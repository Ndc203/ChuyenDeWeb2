<?php

namespace App\Helpers;

class XssHelper
{
    /**
     * Sanitize string để ngăn chặn XSS
     *
     * @param string|null $input
     * @return string|null
     */
    public static function sanitize(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        // Chuyển đổi các ký tự đặc biệt thành HTML entities
        $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        
        // Loại bỏ các thẻ script và các thẻ nguy hiểm
        $input = strip_tags($input);
        
        // Loại bỏ các chuỗi javascript:
        $input = preg_replace('/javascript:/i', '', $input);
        
        // Loại bỏ các event handlers
        $input = preg_replace('/on\w+\s*=/i', '', $input);
        
        return $input;
    }

    /**
     * Sanitize array của dữ liệu
     *
     * @param array $data
     * @return array
     */
    public static function sanitizeArray(array $data): array
    {
        array_walk_recursive($data, function(&$item) {
            if (is_string($item)) {
                $item = self::sanitize($item);
            }
        });

        return $data;
    }

    /**
     * Sanitize HTML content - cho phép một số thẻ an toàn
     * Dùng cho content như bài viết, mô tả sản phẩm
     *
     * @param string|null $html
     * @return string|null
     */
    public static function sanitizeHtml(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        // Các thẻ được phép (whitelist)
        $allowedTags = '<p><br><strong><em><u><h1><h2><h3><h4><h5><h6><ul><ol><li><a><img><blockquote><code><pre>';
        
        // Giữ lại các thẻ được phép
        $html = strip_tags($html, $allowedTags);
        
        // Xóa các thuộc tính nguy hiểm
        $html = preg_replace('/<([^>]+)on\w+\s*=\s*["\'][^"\']*["\']([^>]*)>/i', '<$1$2>', $html);
        
        // Xóa javascript: trong href và src
        $html = preg_replace('/(href|src)\s*=\s*["\']javascript:[^"\']*["\']/i', '', $html);
        
        // Xóa data: URLs (trừ images)
        $html = preg_replace('/(href)\s*=\s*["\']data:[^"\']*["\']/i', '', $html);
        
        return $html;
    }

    /**
     * Escape output để hiển thị an toàn
     *
     * @param string|null $output
     * @return string|null
     */
    public static function escape(?string $output): ?string
    {
        if ($output === null) {
            return null;
        }

        return htmlspecialchars($output, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Clean URL để ngăn chặn XSS qua URL
     *
     * @param string|null $url
     * @return string|null
     */
    public static function sanitizeUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        // Chỉ cho phép http, https, và relative URLs
        if (!preg_match('/^(https?:\/\/|\/)/i', $url)) {
            return '';
        }

        // Loại bỏ javascript:
        $url = preg_replace('/javascript:/i', '', $url);
        
        // Loại bỏ data:
        $url = preg_replace('/data:/i', '', $url);
        
        return filter_var($url, FILTER_SANITIZE_URL) ?: '';
    }

    /**
     * Validate và sanitize email
     *
     * @param string|null $email
     * @return string|null
     */
    public static function sanitizeEmail(?string $email): ?string
    {
        if ($email === null) {
            return null;
        }

        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    /**
     * Sanitize filename để tránh path traversal và XSS
     *
     * @param string|null $filename
     * @return string|null
     */
    public static function sanitizeFilename(?string $filename): ?string
    {
        if ($filename === null) {
            return null;
        }

        // Loại bỏ các ký tự đặc biệt nguy hiểm
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
        
        // Loại bỏ path traversal
        $filename = str_replace(['../', '..\\', '../', '.\\'], '', $filename);
        
        return $filename;
    }

    /**
     * Kiểm tra input có chứa mã XSS nguy hiểm không
     *
     * @param string $input
     * @return bool
     */
    public static function containsXss(string $input): bool
    {
        $dangerous_patterns = [
            '/<script\b[^>]*>(.*?)<\/script>/is',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/eval\(/i',
            '/expression\(/i',
        ];

        foreach ($dangerous_patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }
}
