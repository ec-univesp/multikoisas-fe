import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

// ponytail: production builds transform icon .svg imports into React components via
// @svgr/webpack (see next.config.ts); vitest has no webpack loader, so it needs its
// own minimal stand-in. Swap for @svgr/rollup if the stub component ever falls short.
const svgAsReactComponentStub = (): Plugin => ({
  name: 'svg-as-react-component-stub',
  transform(_code, id) {
    if (!id.endsWith('.svg')) return undefined;
    return "import * as React from 'react';\nexport default function SvgIconStub(props) { return React.createElement('svg', props); }";
  },
});

export default defineConfig({
  plugins: [svgAsReactComponentStub(), react()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/entities/**', 'src/features/**', 'src/widgets/**'],
      exclude: ['**/*.test.*', '**/index.ts'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
