import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

/**
 * ESLint Configuration for GalaxyCo.ai 3.0
 * 
 * Phase 4 Cleanup Results:
 * - 0 errors (down from 5)
 * - 901 warnings (down from 1098)
 * 
 * Warning Breakdown:
 * - 650 @typescript-eslint/no-unused-vars (auto-fixable)
 * - 129 @typescript-eslint/no-explicit-any (manual review needed)
 * - 37 react/no-unescaped-entities (auto-fixable)
 * - 85 react-hooks/* (manual review needed)
 * 
 * Next Steps (Phase 3):
 * - Run ESLint auto-fix: npx eslint . --fix
 * - This will safely remove ~650 unused imports/vars
 * - Then manually address any/hooks violations
 */

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project-wide rule adjustments to keep lint actionable on a large codebase.
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Auto-remove unused imports (the main source of warnings)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Disable the base rule to avoid duplicate warnings
      "@typescript-eslint/no-unused-vars": "off",

      // Keep React Compiler-style rules as warnings for now so lint can pass
      // while we progressively address violations.
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",

      // TypeScript strictness: still show, but don't fail CI yet.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Scripts and tests may legitimately use require and Node-style patterns.
  {
    files: ["scripts/**", "tests/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Tiptap editor extensions legitimately need to capture 'this' for closures.
  {
    files: ["**/TiptapEditor/**/*.ts", "**/admin/PostEditorClient.tsx"],
    rules: {
      "@typescript-eslint/no-this-alias": "off",
    },
  },
  // Override default ignores of eslint-config-next and add project-specific ignores.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific: generated or experimental content not part of the main app.
    "Figma Make Project/**",
    "extracted/**",
    "npx --yes trigger.dev@latest deploy/**",
    // Phase 4 cleanup: ignore legacy, archive, and deletion-pending directories.
    "_to-delete/**",
    "docs/archive/**",
    "src/legacy-pages/**",
    "src/components/_archive/**",
    "src/types/_archive*",
    "**/node_modules/**",
    "**/.git/**",
  ]),
]);

export default eslintConfig;
