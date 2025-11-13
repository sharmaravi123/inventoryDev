import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend default Next.js + TypeScript rules via FlatCompat
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Global ignore patterns
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "prisma/**",
      "**/@prisma/**",
      "src/generated/**",
    ],
  },

  // General project rules (apply to all files)
  {
    // you can add 'rules' here for general project rules
    rules: {
      // Example: prefer consistency, tweak as needed
      // "no-console": "warn",
    },
  },

  // File-specific config for generated/prisma folders
  {
    files: ["**/@prisma/**", "src/generated/**"],
    rules: {
      // Turn off specific rules for generated code
      "@typescript-eslint/no-require-imports": "off",
      // add more relaxed rules for generated code here if needed
    },
  },
];

export default eslintConfig;
