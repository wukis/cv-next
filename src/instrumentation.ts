import * as Sentry from '@sentry/nextjs';

export async function register() {
  /**
   * Because Next.js can run in one of two environments:
   *   - Node.js (server)
   *   - Edge runtime
   * You can branch here if your config differs.
   */
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      replaysOnErrorSampleRate: 1.0,

      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: 0.1,

      // You can remove this option if you're not planning to use the Sentry Session Replay feature:
      integrations: [
        Sentry.replayIntegration({
          // Additional Replay configuration goes in here, for example:
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // For example, you could set environment or other custom tags
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // For example, you could set environment or other custom tags
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === 'client') {
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      replaysOnErrorSampleRate: 1.0,

      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: 0.1,

      // You can remove this option if you're not planning to use the Sentry Session Replay feature:
      integrations: [
        Sentry.replayIntegration({
          // Additional Replay configuration goes in here, for example:
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // For example, you could set environment or other custom tags
      environment: process.env.NODE_ENV,
    });
  }
}
