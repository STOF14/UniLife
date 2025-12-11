/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during build (we'll handle separately)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
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