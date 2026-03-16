'use client'

import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
}

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
        <div className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg shadow-neutral-950/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
            <Error statusCode={500} title="Something went wrong." />
          </div>
        </div>
      </body>
    </html>
  )
}
