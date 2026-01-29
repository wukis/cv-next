import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
      productionBrowserSourceMaps: true,
      pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
      // Performance optimizations
      compress: true,
      // Optimize images
      images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
      },
      // Experimental optimizations
      experimental: {
        optimizeCss: true,
      },
      // Reduce bundle size
      compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
          exclude: ['error', 'warn', 'log'], // Keep console.log for easter egg
        } : false,
      },
      // Optimize bundle splitting
      webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
          // Split chunks more aggressively
          config.optimization = {
            ...config.optimization,
            splitChunks: {
              chunks: 'all',
              cacheGroups: {
                default: false,
                vendors: false,
                // Vendor chunk for react-icons
                reactIcons: {
                  name: 'react-icons',
                  chunks: 'all',
                  test: /[\\/]node_modules[\\/]react-icons[\\/]/,
                  priority: 20,
                  reuseExistingChunk: true,
                },
                // Common vendor chunk
                vendor: {
                  name: 'vendor',
                  chunks: 'all',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  reuseExistingChunk: true,
                },
              },
            },
          };
        }
        return config;
      },
}

export default withSentryConfig(
    nextConfig,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      org: "private-u0s",
      project: "cv-next",

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      // Disabled to reduce bundle size - modern browsers don't need IE11 support
      transpileClientSDK: false,

      // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      // This can increase your server load as well as your hosting bill.
      // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
      // side errors will fail.
      // tunnelRoute: "/monitoring",

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Reduce bundle size by excluding unused Sentry features
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayCanvas: true,
        excludeReplayWorker: true,
      },

      // Webpack configuration - merged with nextConfig webpack
      webpack: (config, options) => {
        // Call the nextConfig webpack function first if it exists
        if (nextConfig.webpack) {
          config = nextConfig.webpack(config, options);
        }
        // Optimize tree-shaking
        config.optimization = {
          ...config.optimization,
          usedExports: true,
          sideEffects: false,
        };
        return config;
      },
    }
);
