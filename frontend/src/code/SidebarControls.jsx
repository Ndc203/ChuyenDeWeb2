import React from "react";
import { useThemeLang } from "./ThemeLangContext";

export default function SidebarControls({ style }) {
  const { theme, language, toggleTheme, toggleLanguage } = useThemeLang();

  return (
    <div style={style}>
      <button
        onClick={toggleTheme}
        style={{ padding: "10px 0", borderRadius: "8px", border: "none", cursor: "pointer", background: theme === "dark" ? "#444" : "#eee", color: theme === "dark" ? "#fff" : "#222", fontWeight: "bold" }}
      >
        {theme === "light" ? "🌙 " + (language === "vi" ? "Chế độ tối" : "Dark mode") : "☀️ " + (language === "vi" ? "Chế độ sáng" : "Light mode")}
      </button>

      <button
        onClick={toggleLanguage}
        style={{ padding: "10px 0", borderRadius: "8px", border: "none", cursor: "pointer", background: theme === "dark" ? "#444" : "#eee", color: theme === "dark" ? "#fff" : "#222", fontWeight: "bold" }}
      >
        {language === "vi" ? "🇬🇧 English" : "🇻🇳 Tiếng Việt"}
      </button>
    </div>
  );
}
