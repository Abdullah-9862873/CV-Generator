/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports for faster builds and smaller bundles
    optimizePackageImports: ['lucide-react', 'zustand', 'tesseract.js'],
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
  
  // Enable compression
  compress: true,
  
  // Optimize for production
  poweredByHeader: false,
  generateEtags: false,
  
  // Improve routing performance
  trailingSlash: false,
  
  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;
