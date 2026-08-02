'use client'

import { useEffect, useState } from 'react'

export function useDeferredRender({
  timeoutMs = 2000,
  fallbackMs = 300,
}: {
  timeoutMs?: number
  fallbackMs?: number
} = {}) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setShouldRender(true), {
        timeout: timeoutMs,
      })

      return () => cancelIdleCallback(id)
    }

    const timer = setTimeout(() => setShouldRender(true), fallbackMs)
    return () => clearTimeout(timer)
  }, [fallbackMs, timeoutMs])

  return shouldRender
}
