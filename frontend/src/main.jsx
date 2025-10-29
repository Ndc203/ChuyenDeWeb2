// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import các trang
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage.jsx";
import AdminPostPage from "./pages/admin/AdminPostPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

const router = createBrowserRouter([
  { path: "/", element: <AdminCategoriesPage /> },
  { path: "/admin/categories", element: <AdminCategoriesPage /> },
  { path: "/admin/products", element: <AdminProductsPage /> },
  { path: "/admin/posts", element: <AdminPostPage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "*", element: <Login /> }, // 404 → về login
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);