import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "client/**", "server/**", "e2e/test-results/**", "e2e/playwright-report/**"] },
  {
    files: ["e2e/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
    rules: { ...js.configs.recommended.rules, "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] },
  },
];
