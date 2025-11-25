// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeLangProvider } from "./code/ThemeLangContext";
import LayoutWrapper from "./code/LayoutWrapper";
import GlobalDarkModeApplier from "./code/GlobalDarkModeApplier";

// Import các trang
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
import ShopPage from "./pages/shop/ShopPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import ShopPostPage from "./pages/shop/ShopPostPage.jsx";
import ShopPostDetailPage from "./pages/shop/ShopPostDetailPage.jsx";
import AdminOrdersPage from "./pages/admin/order/AdminOrdersPage.jsx";
import AdminRevenueReportPage from "./pages/admin/report/AdminRevenueReportPage.jsx";
import CartPage from "./pages/shop/CartPage.jsx";
import ProductDetail from './pages/shop/ProductDetail';
import CheckoutPage from './pages/shop/CheckoutPage';
import PaymentPendingPage from './pages/shop/PaymentPendingPage.jsx';
import OrderSuccessPage from './pages/shop/OrderSuccessPage.jsx';
import OrderHistoryPage from './pages/shop/OrderHistoryPage';
import OrderDetailsPage from './pages/shop/OrderDetailsPage';
import ProfilePage from './pages/shop/ProfilePage.jsx';

const router = createBrowserRouter([
  { path: "/", element: <ShopPage /> },
  { path: "/admin/categories", element: <AdminCategoriesPage /> },
  { path: "/admin/postcategories", element: <AdminPostCategoriesPage /> },
  { path: "/admin/products", element: <AdminProductsPage /> },
  { path: "/admin/products/add", element: <AdminProductAddPage /> },
  { path: "/admin/products/edit/:id", element: <AdminProductEditPage /> },
  { path: "/admin/products/:productId/history", element: <AdminProductHistoryPage /> },
  { path: "/admin/stock", element: <AdminStockPage /> },
  { path: "/admin/posts", element: <AdminPostPage /> },
  { path: "/admin/comments", element: <AdminCommentsPage /> },
  { path: "/admin/post-statistics", element: <AdminPostStatsPage /> },
  { path: "/admin/dashboard", element: <AdminDashboardPage /> },
  { path: "/admin/brands", element: <AdminBrandsPage /> },
  { path: "/admin/users", element: <AdminUsersPage /> },
  { path: "/admin/activity-history", element: <AdminActivityHistoryPage /> },
  { path: "/admin/user-statistics", element: <AdminUserStatisticsPage /> },
  { path: "/admin/permissions", element: <AdminPermissionsPage /> },
  { path: "/admin/profile", element: <AdminProfilePage /> },
  { path: "/admin/profile/:id", element: <AdminProfilePage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/admin/coupons", element: <AdminCouponsPage /> },
  { path: "/admin/reviews", element: <AdminReviewsPage /> },
  { path: "/shop", element: <ShopPage /> },
  { path: "/posts", element: <ShopPostPage /> },
  { path: "/posts/:id", element: <ShopPostDetailPage /> },
  { path: "/admin/orders", element: <AdminOrdersPage /> },
  { path: "/admin/revenue-report", element: <AdminRevenueReportPage /> },
  { path: "/cart", element: <CartPage /> },
  { path: "/product/:slug", element: <ProductDetail /> },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/payment-pending/:orderId",element: <PaymentPendingPage /> },
  { path: "/order-success/:orderId",element: <OrderSuccessPage /> },
  { path: "/orders", element: <OrderHistoryPage /> },
  { path: "/orders/:id", element: <OrderDetailsPage /> },
  { path: "/profile", element: <ProfilePage /> },
  //{ path: "*", element: <Login /> }, // 404 → về login
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
