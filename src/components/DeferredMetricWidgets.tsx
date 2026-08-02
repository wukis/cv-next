'use client'

import dynamic from 'next/dynamic'

import { useDeferredRender } from '@/components/useDeferredRender'

// Lazy load the metric widgets component
const MetricWidgets = dynamic(() => import('@/components/MetricWidgets'), {
  ssr: false,
})

/**
 * Defers loading of the metric widgets until after initial paint.
 * This prevents the widgets from blocking the main thread during page load,
 * improving Total Blocking Time (TBT) and other Core Web Vitals.
 */
export default function DeferredMetricWidgets() {
  const shouldRender = useDeferredRender()

  if (!shouldRender) {
    return null
  }

  return <MetricWidgets />
}
