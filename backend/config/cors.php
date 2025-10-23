<?php

return [
    // Áp dụng cho toàn bộ API
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Thêm tất cả port dev Vite mà bạn đang dùng (5173/5174/5175)
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
    ],

    'allowed_origins_patterns' => [],

    // Cho phép mọi header từ frontend
    'allowed_headers' => ['*'],

    // Không cần expose header gì đặc biệt
    'exposed_headers' => [],

    // Cache preflight (giữ 0 cho dev)
    'max_age' => 0,

    // Với API hiện tại không cần cookie
    'supports_credentials' => false,
];
