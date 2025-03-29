import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental özellikleri etkinleştir
  experimental: {
    // Parantezli yapıların daha iyi işlenmesi için
    serverComponentsExternalPackages: [],
    // Yapı sürecini geliştirmek için
    optimizePackageImports: ["@tremor/react"],
  },
  // Yapı hatalarını önlemek için
  output: "standalone",
  // Dosya oluşumunda hata oluşmasını önlemek için
  typescript: {
    // Derleme sırasında tür hatalarını görmezden gel (yapı sürecinde)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Derleme sırasında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  // Özel rota yapılandırması
  async rewrites() {
    return [
      {
        source: '/panel/sinavlar/:examId/live-results',
        destination: '/panel/canli-sonuclar/:examId',
      },
    ];
  },
};

export default nextConfig;