// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import các trang
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage.jsx";
import AdminPostPage from "./pages/admin/AdminPostPage.jsx";
import AdminPostCategoriesPage from "./pages/admin/AdminPostCategoriesPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminProductAddPage from "./pages/admin/AdminProductAddPage.jsx";
import AdminProductEditPage from "./pages/admin/AdminProductEditPage.jsx";
import AdminActivityHistoryPage from "./pages/admin/AdminActivityHistoryPage.jsx";
import AdminUserStatisticsPage from "./pages/admin/AdminUserStatisticsPage.jsx";
import AdminPermissionsPage from "./pages/admin/AdminPermissionsPage.jsx";
import AdminProfilePage from "./pages/admin/AdminProfilePage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

const router = createBrowserRouter([
  { path: "/", element: <AdminCategoriesPage /> },
  { path: "/admin/categories", element: <AdminCategoriesPage /> },
  { path: "/admin/postcategories", element: <AdminPostCategoriesPage /> },
  { path: "/admin/products", element: <AdminProductsPage /> },
  { path: "/admin/products/add", element: <AdminProductAddPage /> },
  { path: "/admin/products/edit/:id", element: <AdminProductEditPage /> },
  { path: "/admin/posts", element: <AdminPostPage /> },
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
  //{ path: "*", element: <Login /> }, // 404 → về login
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
