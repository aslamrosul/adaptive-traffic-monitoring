import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Mark server-only packages (Redis uses Node.js built-ins)
  serverExternalPackages: ['redis', '@redis/client'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',  // Allow all Google profile images
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
  },
  
  // Webpack config for server-side modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow Node.js built-in modules on server
      config.externals = config.externals || [];
      config.externals.push({
        'redis': 'commonjs redis',
        '@redis/client': 'commonjs @redis/client',
      });
    }
    return config;
  },
  
  // Empty turbopack config to silence warning
  turbopack: {},
};

export default nextConfig;
