import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminCategoriesPage from "./pages/AdminCategoriesPage.jsx";

const router = createBrowserRouter([
  { path: "/", element: <AdminCategoriesPage /> },
  { path: "/admin/categories", element: <AdminCategoriesPage /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
