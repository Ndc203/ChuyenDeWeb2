// src/api/axiosClient.js
import axios from 'axios';

// 1. Cấu hình Base URL
const axiosClient = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "") + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Khóa lưu token (đổi tên nếu bạn dùng tên khác)
const TOKEN_KEY = 'authToken'; 

// 2. Interceptor cho REQUEST (Tự động gắn Token)
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Nếu gửi FormData thì để browser tự set boundary, tránh lỗi upload
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor cho RESPONSE (Tự động xử lý lỗi)
axiosClient.interceptors.response.use(
    (response) => {
        // Trả về data trực tiếp để đỡ phải gọi .data nhiều lần ở component
        // (Tùy chọn: nếu backend trả về dạng { data: ... } thì return response.data)
        return response; 
    },
    (error) => {
        // Xử lý lỗi 401 (Unauthorized) chung cho toàn bộ App
        if (error.response && error.response.status === 401) {
            console.error("Phiên đăng nhập hết hạn.");
            
            // Xóa token cũ
            localStorage.removeItem(TOKEN_KEY);
            
            // Chuyển hướng về trang login
            // Lưu ý: dùng window.location để reload lại trang cho sạch state
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
