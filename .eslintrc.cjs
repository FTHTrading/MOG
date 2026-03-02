/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // ── Hardening Rules ──────────────────────────────────────────────────────
    // These rules enforce the 10 system invariants at the code level.

    // No `any` — every type must be explicit
    '@typescript-eslint/no-explicit-any': 'warn',

    // No unused variables — dead code is entropy
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // No require() — ESM only
    '@typescript-eslint/no-require-imports': 'error',

    // No console.log in packages (use structured logging)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Enforce consistent return types
    '@typescript-eslint/explicit-function-return-type': 'off',

    // No floating promises — every async must be awaited or void-casted
    '@typescript-eslint/no-floating-promises': 'off', // enable when tsconfig project refs are set

    // Prefer const
    'prefer-const': 'error',

    // No var
    'no-var': 'error',

    // Strict equality
    'eqeqeq': ['error', 'always'],
  },
  overrides: [
    {
      // Relaxed rules for test files
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      // Relaxed rules for Next.js app
      files: ['apps/control-plane/**'],
      rules: {
        'no-console': 'off', // Client-side logging is fine
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', '.next', '.turbo'],
};
