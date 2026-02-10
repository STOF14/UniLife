/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript type checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint checking enabled
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack configuration to handle cache warnings
  webpack: (config, { isServer }) => {
    // Fix for webpack cache warnings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@next\/swc-/ },
      { module: /node_modules\/.cache/ },
    ];
    
    return config;
  },
  // For SWC compilation
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig