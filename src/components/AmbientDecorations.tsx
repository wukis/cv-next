'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const HexagonServiceNetwork = dynamic(
  () => import('@/components/HexagonServiceNetwork'),
  { ssr: false },
)

const MetricWidgets = dynamic(() => import('@/components/MetricWidgets'), {
  ssr: false,
})

const LogTerminal = dynamic(() => import('@/components/LogTerminal'), {
  ssr: false,
})

const EmergencyCallOverlay = dynamic(
  () => import('@/components/EmergencyCallOverlay'),
  { ssr: false },
)

const ConsoleEasterEgg = dynamic(
  () =>
    import('@/components/ConsoleEasterEgg').then((mod) => ({
      default: mod.ConsoleEasterEgg,
    })),
  { ssr: false },
)

export default function AmbientDecorations() {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let idleId: number | undefined

    const scheduleActivation = () => {
      const activate = () => {
        setShouldRender(true)
      }

      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(activate, { timeout: 4000 })
        return
      }

      timeoutId = setTimeout(activate, 1500)
    }

    if (document.readyState === 'complete') {
      scheduleActivation()
    } else {
      window.addEventListener('load', scheduleActivation, { once: true })
    }

    return () => {
      window.removeEventListener('load', scheduleActivation)

      if (typeof idleId === 'number' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <>
      <ConsoleEasterEgg />
      <HexagonServiceNetwork />
      <MetricWidgets />
      <EmergencyCallOverlay />
      <LogTerminal />
    </>
  )
}
