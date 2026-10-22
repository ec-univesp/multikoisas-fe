import type { NextConfig } from "next";
import { API_URL } from "./src/entities/product/api";

const nextConfig: NextConfig = {
  // A multikoisas-api não envia cabeçalhos CORS: o navegador fala com a mesma origem.
  rewrites: async () => [{ source: "/api/:path*", destination: `${API_URL}/:path*` }],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
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
