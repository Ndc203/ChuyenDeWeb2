import React from "react";
import { Globe } from "lucide-react";
import { useThemeLang } from "./ThemeLangContext";

export default function SidebarBottomControls() {
  const { language, toggleLanguage } = useThemeLang();

  return (
    <div>
      <button
        onClick={toggleLanguage}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50"
      >
        <Globe size={16} /> {language === "vi" ? "English" : "Tiếng Việt"}
      </button>
    </div>
  );
}
