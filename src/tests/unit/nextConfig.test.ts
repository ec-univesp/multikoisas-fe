import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

describe('next.config redirects', () => {
  it('sends the old portuguese routes permanently to the english ones', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual([
      { source: '/vitrine', destination: '/showcase', permanent: true },
      { source: '/produto/:slug', destination: '/product/:slug', permanent: true },
      { source: '/admin/produtos', destination: '/admin/products', permanent: true },
      { source: '/admin/categorias', destination: '/admin/categories', permanent: true },
      { source: '/admin/canais', destination: '/admin/sales-channels', permanent: true },
    ]);
  });
});

describe('next.config rewrites', () => {
  it('sends the browser /api calls to the multikoisas api on the same origin', async () => {
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual([
      { source: '/api/:path*', destination: 'https://multikoisas-univesp.onrender.com/:path*' },
    ]);
  });
});
