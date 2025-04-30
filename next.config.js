/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'pg': 'pg',
      'pg-pool': 'pg-pool'
    })
    
    // Node.js modüllerini mock'lamak için
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      path: false
    };
    
    return config
  },
  images: {
    domains: ['localhost', 'acadezone.s3.eu-central-1.amazonaws.com'],
  },
}

module.exports = nextConfig
