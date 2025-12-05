import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project-wide rule adjustments to keep lint actionable on a large codebase.
  {
    rules: {
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
  ]),
]);

export default eslintConfig;
