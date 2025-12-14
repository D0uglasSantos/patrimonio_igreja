import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone apenas para Docker, não para Vercel
  // A Vercel gerencia isso automaticamente
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  
  // Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
