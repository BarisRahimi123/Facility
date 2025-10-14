/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  serverActions: {
    bodySizeLimit: '50mb', // Increased from default 1mb to support larger file uploads
  },
  webpack: (config, { isServer }) => {
    // Ensure Node-only modules are not bundled for the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
      path: false,
      http: false,
      https: false,
      url: false,
      zlib: false,
    };
    // Explicitly alias canvas to false to avoid pdfjs NodeCanvasFactory requiring it
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    
    // Ensure CSS is handled properly
    if (config.optimization.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        styles: {
          name: 'styles',
          test: /\.(css|scss)$/,
          chunks: 'all',
          enforce: true,
        },
      };
    }
    
    return config;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ahntaamtsypranvnofxy.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // turbo: {
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js',
    //     },
    //   },
    // },
    // optimizeCss: true, // Disabled to fix entryCSSFiles error
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  poweredByHeader: false,
  compress: true,
  compiler: {
    // Temporarily disable console removal in production for debugging
    removeConsole: false, // process.env.NODE_ENV === 'production',
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;   