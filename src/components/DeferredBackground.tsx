'use client'

import dynamic from 'next/dynamic'

import { useDeferredRender } from '@/components/useDeferredRender'

// Lazy load the heavy canvas animation component
const HexagonServiceNetwork = dynamic(
  () => import('@/components/HexagonServiceNetwork'),
  { ssr: false },
)

/**
 * Defers loading of the background animation until after initial paint.
 * This prevents the animation from blocking the main thread during page load,
 * improving Total Blocking Time (TBT) and other Core Web Vitals.
 */
export default function DeferredBackground() {
  const shouldRender = useDeferredRender()

  if (!shouldRender) {
    return null
  }

  return <HexagonServiceNetwork />
}
