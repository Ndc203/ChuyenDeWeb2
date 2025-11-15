# Dark Mode Implementation Guide

## What's been done:

1. **Tailwind dark mode enabled** (`tailwind.config.js`):
   - Added `darkMode: 'class'` configuration
   - Dark mode activates when `dark` class is added to `<html>` element

2. **Theme context updated** (`ThemeLangContext.jsx`):
   - Toggles `dark` class on `document.documentElement` when theme changes
   - All Tailwind `dark:` utilities automatically activate/deactivate

3. **Layout wrapper created** (`LayoutWrapper.jsx`):
   - Provides global base background and text colors
   - Applied in `main.jsx` to wrap entire app

4. **PageWrapper component created** (`PageWrapper.jsx`):
   - Use this to wrap admin page containers
   - Replaces hardcoded `className="min-h-screen flex bg-slate-50 text-slate-800"`
   - Example: `<PageWrapper><AdminSidebar /> <main>...</main></PageWrapper>`

5. **AdminUsersPage.jsx updated** as example:
   - Wrapped with `<PageWrapper>`
   - All static light colors converted to use `dark:` variants
   - Example changes:
     - `bg-white` → `bg-white dark:bg-slate-800`
     - `text-slate-900` → `text-slate-900 dark:text-slate-100`
     - `hover:bg-slate-50` → `hover:bg-slate-50 dark:hover:bg-slate-700`

## How to apply to other pages:

### Pattern 1: Replace container wrapper
```jsx
// Before
<div className="min-h-screen flex bg-slate-50 text-slate-800">
  <AdminSidebar />
  <main>...</main>
</div>

// After
<PageWrapper>
  <AdminSidebar />
  <main>...</main>
</PageWrapper>
```

### Pattern 2: Add dark: variants to key elements
```jsx
// Before: text-slate-900
// After: text-slate-900 dark:text-slate-100

// Before: bg-white
// After: bg-white dark:bg-slate-800

// Before: border-slate-300
// After: border-slate-300 dark:border-slate-600

// Before: text-slate-500
// After: text-slate-500 dark:text-slate-400

// Before: hover:bg-slate-50
// After: hover:bg-slate-50 dark:hover:bg-slate-700

// Before: bg-slate-50 (headers/sections)
// After: bg-slate-50 dark:bg-slate-700

// Before: divide-slate-200 (table borders)
// After: divide-slate-200 dark:divide-slate-700
```

## Pages to update:

See workspace for these files - apply the same pattern as AdminUsersPage.jsx:

- [ ] frontend/src/pages/admin/AdminCategoriesPage.jsx
- [ ] frontend/src/pages/admin/AdminPostPage.jsx
- [ ] frontend/src/pages/admin/AdminProductsPage.jsx
- [ ] frontend/src/pages/admin/AdminProductAddPage.jsx
- [ ] frontend/src/pages/admin/AdminProductEditPage.jsx
- [ ] frontend/src/pages/admin/AdminBrandsPage.jsx
- [ ] frontend/src/pages/admin/AdminStockPage.jsx
- [ ] frontend/src/pages/admin/AdminPermissionsPage.jsx
- [ ] frontend/src/pages/admin/AdminProfilePage.jsx
- [ ] frontend/src/pages/admin/AdminCouponsPage.jsx
- [ ] frontend/src/pages/admin/AdminReviewsPage.jsx
- [ ] And others...

## For quick bulk updates:

Use Find & Replace in VS Code (Ctrl+H):
1. Find: `className="min-h-screen flex bg-slate-50 text-slate-800"`
   Replace: Can't do in one replace due to need for PageWrapper

2. Better approach: Use the pattern for each color variant:
   - Find: `text-slate-900"` Replace: `text-slate-900 dark:text-slate-100"`
   - Find: `bg-white"` Replace: `bg-white dark:bg-slate-800"`
   - Find: `text-slate-500"` Replace: `text-slate-500 dark:text-slate-400"`
   - etc.

## For Language translation:

Import `useThemeLang` hook and use `t()` function:
```jsx
import { useThemeLang } from "../../code/ThemeLangContext";

// In component
const { t } = useThemeLang();

// In JSX
<h1>{t("user_list")}</h1>  // Translates based on language state
```

Available translation keys (add more to `ThemeLangContext.jsx`):
- dashboard, products, stock, reviews, categories, brands
- user_list, activity_history, user_stats, permissions, profile
- post_list, post_stats, post_categories, comments
- logout, dark_mode, light_mode, english, vietnamese
