import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    // Local-only folders: agent worktrees and gitignored docs/e2e scripts.
    '.claude/**',
    'docs/**',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        // Vitest mocks type importOriginal with typeof import('module').
        { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Command-line scripts print their result.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  // Must stay last: turns off the stylistic rules that Prettier owns.
  prettier,
]);

export default eslintConfig;
