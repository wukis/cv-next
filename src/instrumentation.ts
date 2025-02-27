import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry configuration
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",
      tracesSampleRate: 1,
      debug: false,
    });
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry configuration
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",
      tracesSampleRate: 1,
      debug: false,
    });
  } else {
    // Client-side Sentry configuration
    Sentry.init({
      dsn: "https://0bdcdf9a33e935bd8c0b590736dc1940@o4507296284475392.ingest.de.sentry.io/4507296287359056",
      tracesSampleRate: 1,
      debug: false,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
    });
  }
}
