import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  /* config options here */
};

// Commenting out PWA for now - uncomment when you need it
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development'
// })

// export default withPWA(nextConfig);

export default nextConfig;