import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"; // Thêm Navigate
import { ThemeLangProvider } from "./code/ThemeLangContext";
import LayoutWrapper from "./code/LayoutWrapper";
import GlobalDarkModeApplier from "./code/GlobalDarkModeApplier";


// --- Import các trang (Giữ nguyên như cũ) ---
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage.jsx";
import AdminPostPage from "./pages/admin/AdminPostPage.jsx";
import AdminPostCategoriesPage from "./pages/admin/AdminPostCategoriesPage.jsx";
import AdminCommentsPage from "./pages/admin/AdminCommentsPage.jsx";
import AdminPostStatsPage from "./pages/admin/AdminPostStatsPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminProductAddPage from "./pages/admin/AdminProductAddPage.jsx";
import AdminProductEditPage from "./pages/admin/AdminProductEditPage.jsx";
import AdminProductHistoryPage from "./pages/admin/AdminProductHistoryPage.jsx";
import AdminActivityHistoryPage from "./pages/admin/AdminActivityHistoryPage.jsx";
import AdminUserStatisticsPage from "./pages/admin/AdminUserStatisticsPage.jsx";
import AdminStockPage from "./pages/admin/AdminStockPage.jsx";
import AdminPermissionsPage from "./pages/admin/AdminPermissionsPage.jsx";
import AdminProfilePage from "./pages/admin/AdminProfilePage.jsx";
import AdminCouponsPage from "./pages/admin/coupon/AdminCouponsPage.jsx";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage.jsx";
import AdminOrdersPage from "./pages/admin/order/AdminOrdersPage.jsx";
import AdminRevenueReportPage from "./pages/admin/report/AdminRevenueReportPage.jsx";

import ShopPage from "./pages/shop/ShopPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import SocialCallback from "./pages/auth/SocialCallback.jsx";
import ShopPostPage from "./pages/shop/ShopPostPage.jsx";
import ShopPostDetailPage from "./pages/shop/ShopPostDetailPage.jsx";
import CartPage from "./pages/shop/CartPage.jsx";
import ProductDetail from './pages/shop/ProductDetail';
import CheckoutPage from './pages/shop/CheckoutPage';
import PaymentPendingPage from './pages/shop/PaymentPendingPage.jsx';
import OrderSuccessPage from './pages/shop/OrderSuccessPage.jsx';
import OrderHistoryPage from './pages/shop/OrderHistoryPage';
import OrderDetailsPage from './pages/shop/OrderDetailsPage';
import ProfilePage from './pages/shop/ProfilePage.jsx';

// --- 1. TẠO COMPONENT BẢO VỆ ROUTE ---
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("authToken");
  const userRole = localStorage.getItem("userRole"); // Lấy role lưu lúc login

  // Chưa đăng nhập -> Đá về Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu yêu cầu Admin mà role không phải Admin -> Đá về trang chủ
  if (requiredRole === "admin" && userRole !== "admin" && userRole !== "Admin") {
    alert("Bạn không có quyền truy cập trang này!");
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- 2. CẤU HÌNH ROUTE ---
const router = createBrowserRouter([
  // === PUBLIC ROUTES (Ai cũng vào được) ===
  { path: "/", element: <ShopPage /> },
  { path: "/posts", element: <ShopPostPage /> },
  { path: "/posts/:id", element: <ShopPostDetailPage /> },
  { path: "/product/:slug", element: <ProductDetail /> }, // Chi tiết sản phẩm
  
  // Auth
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/auth/social-callback", element: <SocialCallback /> },

  // === CUSTOMER ROUTES (Phải đăng nhập mới vào được) ===
  { 
    path: "/cart", 
    element: <ProtectedRoute><CartPage /></ProtectedRoute> 
  },
  { 
    path: "/checkout", 
    element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> 
  },
  { 
    path: "/payment-pending/:orderId", 
    element: <ProtectedRoute><PaymentPendingPage /></ProtectedRoute> 
  },
  { 
    path: "/order-success/:orderId", 
    element: <ProtectedRoute><OrderSuccessPage /></ProtectedRoute> 
  },
  { 
    path: "/orders", 
    element: <ProtectedRoute><OrderHistoryPage /></ProtectedRoute> 
  },
  { 
    path: "/orders/:id", 
    element: <ProtectedRoute><OrderDetailsPage /></ProtectedRoute> 
  },
  { 
    path: "/profile", 
    element: <ProtectedRoute><ProfilePage /></ProtectedRoute> 
  },

  // === ADMIN ROUTES (Phải là Admin mới vào được) ===
  { path: "/admin/dashboard", element: <ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute> },
  { path: "/admin/categories", element: <ProtectedRoute requiredRole="admin"><AdminCategoriesPage /></ProtectedRoute> },
  { path: "/admin/postcategories", element: <ProtectedRoute requiredRole="admin"><AdminPostCategoriesPage /></ProtectedRoute> },
  { path: "/admin/products", element: <ProtectedRoute requiredRole="admin"><AdminProductsPage /></ProtectedRoute> },
  { path: "/admin/products/add", element: <ProtectedRoute requiredRole="admin"><AdminProductAddPage /></ProtectedRoute> },
  { path: "/admin/products/edit/:id", element: <ProtectedRoute requiredRole="admin"><AdminProductEditPage /></ProtectedRoute> },
  { path: "/admin/products/:productId/history", element: <ProtectedRoute requiredRole="admin"><AdminProductHistoryPage /></ProtectedRoute> },
  { path: "/admin/stock", element: <ProtectedRoute requiredRole="admin"><AdminStockPage /></ProtectedRoute> },
  { path: "/admin/posts", element: <ProtectedRoute requiredRole="admin"><AdminPostPage /></ProtectedRoute> },
  { path: "/admin/comments", element: <ProtectedRoute requiredRole="admin"><AdminCommentsPage /></ProtectedRoute> },
  { path: "/admin/post-statistics", element: <ProtectedRoute requiredRole="admin"><AdminPostStatsPage /></ProtectedRoute> },
  { path: "/admin/brands", element: <ProtectedRoute requiredRole="admin"><AdminBrandsPage /></ProtectedRoute> },
  { path: "/admin/users", element: <ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute> },
  { path: "/admin/activity-history", element: <ProtectedRoute requiredRole="admin"><AdminActivityHistoryPage /></ProtectedRoute> },
  { path: "/admin/user-statistics", element: <ProtectedRoute requiredRole="admin"><AdminUserStatisticsPage /></ProtectedRoute> },
  { path: "/admin/permissions", element: <ProtectedRoute requiredRole="admin"><AdminPermissionsPage /></ProtectedRoute> },
  { path: "/admin/profile", element: <ProtectedRoute requiredRole="admin"><AdminProfilePage /></ProtectedRoute> },
  { path: "/admin/profile/:id", element: <ProtectedRoute requiredRole="admin"><AdminProfilePage /></ProtectedRoute> },
  { path: "/admin/coupons", element: <ProtectedRoute requiredRole="admin"><AdminCouponsPage /></ProtectedRoute> },
  { path: "/admin/reviews", element: <ProtectedRoute requiredRole="admin"><AdminReviewsPage /></ProtectedRoute> },
  { path: "/admin/orders", element: <ProtectedRoute requiredRole="admin"><AdminOrdersPage /></ProtectedRoute> },
  { path: "/admin/revenue-report", element: <ProtectedRoute requiredRole="admin"><AdminRevenueReportPage /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeLangProvider>
      <GlobalDarkModeApplier />
      <LayoutWrapper>
        <RouterProvider router={router} />
      </LayoutWrapper>
    </ThemeLangProvider>
  </React.StrictMode>
);
