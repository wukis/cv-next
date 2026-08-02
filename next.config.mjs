import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'",
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]

const nextConfig = {
  productionBrowserSourceMaps: false,
  // Performance optimizations
  compress: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
    {
      source: '/jonas-petrik-cv.pdf',
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex',
        },
      ],
    },
    {
      source: '/:path*.:ext(png|jpg|jpeg|webp|avif|ico|woff|woff2)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
  // Experimental optimizations
  experimental: {
    optimizeCss: true,
  },
  // Reduce bundle size
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn', 'log'], // Keep console.log for easter egg
          }
        : false,
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'private-u0s',
  project: 'cv-next',

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
      config = nextConfig.webpack(config, options)
    }
    // Keep tree-shaking explicit without overriding Next's production chunking.
    config.optimization = {
      ...config.optimization,
      usedExports: true,
    }

    return config
  },
})
