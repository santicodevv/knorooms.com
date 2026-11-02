import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Evita filtrar detalles en la consola del navegador: los errores pasan por reportError.
  {
    rules: { "no-console": "error" },
  },
  {
    files: ["src/lib/report-error.ts", "src/**/*.test.ts"],
    rules: { "no-console": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reportes generados por las pruebas.
    "coverage/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
