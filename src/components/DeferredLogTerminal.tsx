'use client'

import dynamic from 'next/dynamic'

import { useDeferredRender } from '@/components/useDeferredRender'

// Lazy load the log terminal component
const LogTerminal = dynamic(() => import('@/components/LogTerminal'), {
  ssr: false,
})

/**
 * Defers loading of the log terminal until after initial paint.
 * This prevents the terminal from blocking the main thread during page load,
 * improving Total Blocking Time (TBT) and other Core Web Vitals.
 */
export default function DeferredLogTerminal() {
  const shouldRender = useDeferredRender()

  if (!shouldRender) {
    return null
  }

  return <LogTerminal />
}
