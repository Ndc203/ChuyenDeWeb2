import React, { useEffect } from "react";
import { useThemeLang } from "./ThemeLangContext";

/**
 * Global CSS dark mode applier
 * Applies dark mode styles to ALL pages automatically without needing individual updates
 */
export default function GlobalDarkModeApplier() {
  const { theme } = useThemeLang();

  useEffect(() => {
    if (theme === "dark") {
      // Inject comprehensive dark mode CSS that covers all pages
      let styleEl = document.getElementById("global-dark-mode-styles");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "global-dark-mode-styles";
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = `
        /* Global dark mode CSS for all pages */
        
        /* Base colors */
        body {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }

        /* White backgrounds -> dark slate */
        [class*="bg-white"]:not([class*="dark:bg"]) {
          background-color: #1e293b !important;
        }

        /* Light gray backgrounds -> darker slate */
        [class*="bg-slate-50"]:not([class*="dark:bg"]) {
          background-color: #1e293b !important;
        }

        [class*="bg-gray-50"]:not([class*="dark:bg"]) {
          background-color: #1e293b !important;
        }

        /* Text colors */
        [class*="text-slate-900"]:not([class*="dark:"]) {
          color: #f1f5f9 !important;
        }

        [class*="text-slate-800"]:not([class*="dark:"]) {
          color: #f1f5f9 !important;
        }

        [class*="text-slate-700"]:not([class*="dark:"]) {
          color: #e2e8f0 !important;
        }

        [class*="text-slate-600"]:not([class*="dark:"]) {
          color: #cbd5e1 !important;
        }

        [class*="text-slate-500"]:not([class*="dark:"]) {
          color: #cbd5e1 !important;
        }

        [class*="text-slate-400"]:not([class*="dark:"]) {
          color: #94a3b8 !important;
        }

        [class*="text-gray-900"]:not([class*="dark:"]) {
          color: #f1f5f9 !important;
        }

        /* Borders */
        [class*="border-slate-200"]:not([class*="dark:"]) {
          border-color: #334155 !important;
        }

        [class*="border-slate-300"]:not([class*="dark:"]) {
          border-color: #475569 !important;
        }

        [class*="border-slate-100"]:not([class*="dark:"]) {
          border-color: #334155 !important;
        }

        [class*="border-gray-200"]:not([class*="dark:"]) {
          border-color: #334155 !important;
        }

        /* Dividers */
        [class*="divide-slate-200"]:not([class*="dark:"]) {
          border-color: #334155 !important;
        }

        /* Hover states */
        [class*="hover:bg-slate-50"]:not([class*="dark:hover"]) {
          --tw-bg-opacity: 1;
        }
        [class*="hover:bg-slate-50"]:hover {
          background-color: #2d3748 !important;
        }

        [class*="hover:bg-slate-100"]:hover {
          background-color: #2d3748 !important;
        }

        /* Inputs and form elements */
        input:not([class*="dark:"]),
        select:not([class*="dark:"]),
        textarea:not([class*="dark:"]) {
          background-color: #1e293b !important;
          color: #f1f5f9 !important;
          border-color: #475569 !important;
        }

        /* Placeholder text */
        input::placeholder,
        textarea::placeholder {
          color: #94a3b8 !important;
        }

        /* Tables */
        thead:not([class*="dark:"]) {
          background-color: #1e293b !important;
        }

        tbody tr:not([class*="dark:"]) {
          border-color: #334155 !important;
        }

        tbody tr:hover {
          background-color: #2d3748 !important;
        }

        /* Buttons - keep colored buttons */
        button[class*="bg-indigo"],
        button[class*="bg-blue"],
        button[class*="bg-green"],
        button[class*="bg-red"],
        button[class*="bg-purple"] {
          /* Keep original colors */
        }

        /* Light colored buttons */
        button:not([class*="bg-indigo"]):not([class*="bg-blue"]):not([class*="bg-green"]):not([class*="bg-red"]):not([class*="bg-purple"]):not([class*="bg-white"]) {
          /* Normal buttons handled */
        }

        /* Links */
        a:not([class*="dark:"]) {
          color: #60a5fa !important;
        }

        a:hover:not([class*="dark:"]) {
          color: #93c5fd !important;
        }

        /* Cards and containers */
        [class*="shadow"]:not([class*="dark:"]) {
          background-color: #1e293b !important;
        }

        /* Badge/pills */
        [class*="rounded-full"]:not([class*="bg-"]):not([class*="dark:"]) {
          background-color: #1e293b !important;
        }
      `;
    } else {
      // Light mode - remove dark styles
      const styleEl = document.getElementById("global-dark-mode-styles");
      if (styleEl) {
        styleEl.innerHTML = "";
      }
    }
  }, [theme]);

  return null; // This component only injects styles
}
