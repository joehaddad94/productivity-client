import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat config. `next lint` was removed in Next 16, so the `lint` script now
 * invokes ESLint directly and this file replaces the config that command used
 * to supply implicitly. eslint-config-next 16 ships flat configs natively —
 * FlatCompat is not needed (and throws on them).
 */
const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
