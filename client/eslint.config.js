import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react": react, "react-hooks": hooks, "react-refresh": refresh },
    rules: { ...js.configs.recommended.rules, ...hooks.configs.recommended.rules, "react/jsx-uses-vars": "error", "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }], "react-refresh/only-export-components": "off" },
  },
];
