#!/usr/bin/env node

/**
 * Script to add dark mode support to all admin pages
 * Usage: node apply-dark-mode.js
 * 
 * This script:
 * 1. Replaces `className="min-h-screen flex bg-slate-50 text-slate-800"` with PageWrapper
 * 2. Adds dark: variants to common Tailwind classes
 * 3. Adds imports for PageWrapper and useThemeLang
 */

const fs = require('fs');
const path = require('path');

const ADMIN_PAGES_DIR = './frontend/src/pages/admin';

// Color mapping for dark: variants
const classReplacements = [
  { pattern: /bg-white(?!.*dark:)/g, replacement: 'bg-white dark:bg-slate-800' },
  { pattern: /text-slate-900(?!.*dark:)/g, replacement: 'text-slate-900 dark:text-slate-100' },
  { pattern: /text-slate-800(?!.*dark:)/g, replacement: 'text-slate-800 dark:text-slate-50' },
  { pattern: /text-slate-700(?!.*dark:)/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { pattern: /text-slate-600(?!.*dark:)/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { pattern: /text-slate-500(?!.*dark:)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { pattern: /border-slate-300(?!.*dark:)/g, replacement: 'border-slate-300 dark:border-slate-600' },
  { pattern: /border-slate-200(?!.*dark:)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { pattern: /bg-slate-50(?!.*dark:)/g, replacement: 'bg-slate-50 dark:bg-slate-700' },
  { pattern: /hover:bg-slate-50(?!.*dark:)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-700' },
  { pattern: /hover:bg-slate-100(?!.*dark:)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  { pattern: /divide-slate-200(?!.*dark:)/g, replacement: 'divide-slate-200 dark:divide-slate-700' },
];

function getFilesRecursive(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursive(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('Page.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if already updated
    if (content.includes('PageWrapper')) {
      console.log(`✓ Already updated: ${filePath}`);
      return;
    }

    // 1. Add imports if not present
    if (!content.includes('import PageWrapper')) {
      const importMatch = content.match(/(import.*from ["'].*["'];?\n)/);
      if (importMatch) {
        const lastImportEnd = content.lastIndexOf('\n', content.indexOf(importMatch[0]) + importMatch[0].length);
        if (!content.includes('import AdminSidebar')) {
          content = content.replace(
            'import AdminSidebar',
            'import PageWrapper from "../../code/PageWrapper";\nimport AdminSidebar'
          );
        } else {
          const sidebarImportLine = content.match(/import.*AdminSidebar.*from ["'].*["'];/);
          if (sidebarImportLine) {
            content = content.replace(
              sidebarImportLine[0],
              'import PageWrapper from "../../code/PageWrapper";\n' + sidebarImportLine[0]
            );
          }
        }
      }
    }

    // 2. Replace container div with PageWrapper
    content = content.replace(
      /(<\s*div\s+className=["']min-h-screen\s+flex\s+bg-slate-50\s+text-slate-800["']\s*>)\s*(<\s*AdminSidebar\s*\/\s*>)/,
      '<PageWrapper>\n      <AdminSidebar />'
    );

    // 3. Replace closing div with PageWrapper
    if (content.includes('<PageWrapper>')) {
      content = content.replace(
        /(<\/main>\s*<\s*\/\s*div\s*>)\s*(<\/\s*>\s*\);)/,
        '</main>\n    </PageWrapper>\n  );'
      );
    }

    // 4. Apply dark: variants
    for (const { pattern, replacement } of classReplacements) {
      content = content.replace(pattern, replacement);
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
    } else {
      console.log(`- No changes: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
  }
}

// Main
console.log('🚀 Applying dark mode to admin pages...\n');

const files = getFilesRecursive(ADMIN_PAGES_DIR);
console.log(`Found ${files.length} admin pages\n`);

files.forEach(updateFile);

console.log('\n✅ Done!');
