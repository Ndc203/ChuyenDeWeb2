import React from "react";
import { useThemeLang } from "./ThemeLangContext";

/**
 * PageWrapper component for admin pages
 * Applies theme-aware background and text colors to the page container
 */
export default function PageWrapper({ children, className = "" }) {
  const { theme } = useThemeLang();

  const pageClass = `min-h-screen flex ${
    theme === "dark"
      ? "bg-slate-950 text-slate-50"
      : "bg-slate-50 text-slate-800"
  } ${className}`;

  return <div className={pageClass}>{children}</div>;
}
