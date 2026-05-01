import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference / example files shipped alongside procomp docs are
    // not part of the registry codebase.
    "docs/**",
  ]),
  {
    // Registry code is framework-agnostic by mandate (no next/*).
    // Native <img> is the correct choice; consumers wrap in next/image
    // via the imageClassName slot if they want CDN optimization.
    files: ["src/registry/components/**"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
