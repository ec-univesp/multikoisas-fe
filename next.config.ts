import type { NextConfig } from 'next';
import { PRODUCT_IMAGE_HOSTS, PRODUCT_IMAGE_PATH } from './src/entities/product/imageUrl';
import { API_URL } from './src/shared/api/getFromApi';

const nextConfig: NextConfig = {
  // A multikoisas-api não envia cabeçalhos CORS: o navegador fala com a mesma origem.
  rewrites: async () => [{ source: '/api/:path*', destination: `${API_URL}/:path*` }],
  // Old portuguese routes stay reachable for links already shared.
  redirects: async () => [
    { source: '/vitrine', destination: '/showcase', permanent: true },
    { source: '/produto/:slug', destination: '/product/:slug', permanent: true },
    { source: '/admin/produtos', destination: '/admin/products', permanent: true },
    { source: '/admin/categorias', destination: '/admin/categories', permanent: true },
    { source: '/admin/canais', destination: '/admin/sales-channels', permanent: true },
  ],
  images: {
    remotePatterns: PRODUCT_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: `${PRODUCT_IMAGE_PATH}**`,
    })),
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
