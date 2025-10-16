import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend default Next.js + TypeScript rules
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom project rules and ignore settings
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

    // Optional rule adjustments
    overrides: [
      {
        files: ["**/@prisma/**", "src/generated/**"],
        rules: {
          "@typescript-eslint/no-require-imports": "off", 
        },
      },
    ],
  },
];

export default eslintConfig;
