import React from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeLang } from "./ThemeLangContext";

export default function SidebarTopControls() {
  const { theme, toggleTheme, language } = useThemeLang();

  return (
    <div className="px-4 pt-2">
      <button
        onClick={toggleTheme}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50"
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />} 
        {theme === "light" ? (language === "vi" ? "Chế độ tối" : "Dark mode") : (language === "vi" ? "Chế độ sáng" : "Light mode")}
      </button>
    </div>
  );
}
