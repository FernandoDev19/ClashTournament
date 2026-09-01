import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'demos.creative-tim.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['sorer-ineradicable-yolande.ngrok-free.dev'],
};

export default nextConfig;
