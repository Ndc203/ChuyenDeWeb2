import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeLangContext = createContext();

export function ThemeLangProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("vi");

  // Optional: persist to localStorage
  useEffect(() => {
    const t = localStorage.getItem("app_theme");
    const l = localStorage.getItem("app_language");
    if (t) setTheme(t);
    if (l) setLanguage(l);
  }, []);

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app_language", language);
  }, [language]);

  // Apply theme and language to document (so it affects the whole page even if provider is not at root)
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      // Toggle 'dark' class on html for Tailwind dark mode
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Also apply inline styles as fallback
      document.body.style.background = theme === "dark" ? "#111" : "#f8fafc";
      document.body.style.color = theme === "dark" ? "#fff" : "#111";
    } catch (e) {
      // ignore (SSR or non-browser)
    }
  }, [theme]);

  useEffect(() => {
    try {
      document.documentElement.lang = language === "vi" ? "vi" : "en";
    } catch (e) {
      // ignore
    }
  }, [language]);

  const toggleTheme = () => setTheme((s) => (s === "light" ? "dark" : "light"));
  const toggleLanguage = () => setLanguage((l) => (l === "vi" ? "en" : "vi"));

  // Simple translations map (extend as needed)
  const translations = {
    vi: {
      dashboard: "Tổng quan",
      products: "Danh sách Sản phẩm",
      stock: "Tồn kho, Nhập và Xuất",
      reviews: "Đánh giá sản phẩm",
      categories: "Danh mục Sản phẩm",
      brands: "Thương hiệu",
      transaction_management: "QUẢN LÝ GIAO DỊCH",
      coupons: "Mã giảm giá",
      revenue_report: "Báo cáo doanh thu",
      users_section: "NGƯỜI DÙNG",
      user_list: "Danh sách Người dùng",
      activity_history: "Lịch sử hoạt động",
      user_stats: "Thống kê người dùng",
      permissions: "Phân Quyền",
      profile: "Trang cá nhân",
      posts_section: "BÀI VIẾT",
      post_list: "Danh sách Bài viết",
      post_stats: "Thống kê Bài viết",
      post_categories: "Danh sách Chuyên mục Bài Viết",
      comments: "Danh sách Bình luận",
      logout: "Đăng xuất",
      dark_mode: "Chế độ tối",
      light_mode: "Chế độ sáng",
      english: "English",
      vietnamese: "Tiếng Việt",
    },
    en: {
      dashboard: "Dashboard",
      products: "Product List",
      stock: "Stock / In-Out",
      reviews: "Product Reviews",
      categories: "Product Categories",
      brands: "Brands",
      transaction_management: "TRANSACTION MANAGEMENT",
      coupons: "Coupons",
      revenue_report: "Revenue Report",
      users_section: "USER",
      user_list: "User List",
      activity_history: "Activity History",
      user_stats: "User Statistics",
      permissions: "Permissions",
      profile: "Profile",
      posts_section: "POSTS",
      post_list: "Post List",
      post_stats: "Post Stats",
      post_categories: "Post Categories",
      comments: "Comment List",
      logout: "Logout",
      dark_mode: "Dark mode",
      light_mode: "Light mode",
      english: "English",
      vietnamese: "Tiếng Việt",
    },
  };

  const t = (key) => {
    return (translations[language] && translations[language][key]) || key;
  };

  return (
    <ThemeLangContext.Provider value={{ theme, language, setTheme, setLanguage, toggleTheme, toggleLanguage, t }}>
      {children}
    </ThemeLangContext.Provider>
  );
}

export function useThemeLang() {
  return useContext(ThemeLangContext);
}
