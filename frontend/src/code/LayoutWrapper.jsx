import React from "react";
import { useThemeLang } from "./ThemeLangContext";

/**
 * Global layout wrapper that applies theme-aware styles to the entire app.
 * Wraps the RouterProvider or main content.
 * 
 * This component:
 * - Applies background and text color to the page based on theme
 * - Uses CSS custom properties and inline styles to ensure ALL content
 *   (including nested components) respond to theme changes
 */
export default function LayoutWrapper({ children }) {
  const { theme } = useThemeLang();

  // Define CSS that applies to all Tailwind components via custom properties
  const globalStyle = document.createElement('style');
  
  // Use inline style to apply theme colors globally
  const containerStyle = {
    // Set background and text color for the entire layout
    background: theme === "dark" ? "#0f172a" : "#f8fafc",
    color: theme === "dark" ? "#f1f5f9" : "#1e293b",
    transition: "background-color 0.3s, color 0.3s",
    minHeight: "100vh",
    width: "100%",
  };

  // Inject additional CSS for nested components
  React.useEffect(() => {
    if (theme === "dark") {
      // Apply dark mode to all common elements
      document.body.style.backgroundColor = "#0f172a";
      document.body.style.color = "#f1f5f9";
      
      // Apply to inputs, selects, etc.
      const style = `
        [class*="bg-white"]:not(.dark\:bg-slate-800) { background-color: #1e293b !important; }
        [class*="bg-slate-50"]:not(.dark\:bg-slate-700) { background-color: #1e293b !important; }
        [class*="text-slate-"]:not([class*="dark:"]) { color: #f1f5f9 !important; }
        [class*="border-slate-"]:not([class*="dark:"]) { border-color: #334155 !important; }
      `;
      
      // Create or update style element
      let styleEl = document.getElementById("dark-mode-global-styles");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dark-mode-global-styles";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = style;
    } else {
      // Remove dark mode styles
      const styleEl = document.getElementById("dark-mode-global-styles");
      if (styleEl) styleEl.innerHTML = "";
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#1e293b";
    }
  }, [theme]);

  return (
    <div
      style={containerStyle}
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-slate-950 text-slate-50"
          : "bg-slate-50 text-slate-950"
      }`}
    >
      {children}
    </div>
  );
}
