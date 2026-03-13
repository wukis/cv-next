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

const ConsoleEasterEgg = dynamic(
  () =>
    import('@/components/ConsoleEasterEgg').then((mod) => ({
      default: mod.ConsoleEasterEgg,
    })),
  { ssr: false },
)

type AmbientState = {
  enableConsole: boolean
  enableVisuals: boolean
}

function getAmbientState(): AmbientState {
  if (typeof window === 'undefined') {
    return { enableConsole: false, enableVisuals: false }
  }

  const navigatorWithConnection = navigator as Navigator & {
    connection?: { saveData?: boolean }
  }
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const saveData =
    typeof navigatorWithConnection.connection?.saveData === 'boolean' &&
    navigatorWithConnection.connection.saveData

  if (prefersReducedMotion || saveData) {
    return { enableConsole: false, enableVisuals: false }
  }

  const { innerWidth: width, innerHeight: height } = window
  const isLargeViewport = width >= 1280 && width / Math.max(height, 1) > 1.2

  return {
    enableConsole: width >= 1024,
    enableVisuals: isLargeViewport,
  }
}

export default function AmbientDecorations() {
  const [ambientState, setAmbientState] = useState<AmbientState>({
    enableConsole: false,
    enableVisuals: false,
  })
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let idleId: number | undefined

    const scheduleActivation = () => {
      const activate = () => {
        setAmbientState(getAmbientState())
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
      {ambientState.enableConsole && <ConsoleEasterEgg />}
      {ambientState.enableVisuals && (
        <>
          <HexagonServiceNetwork />
          <MetricWidgets />
          <LogTerminal />
        </>
      )}
    </>
  )
}
