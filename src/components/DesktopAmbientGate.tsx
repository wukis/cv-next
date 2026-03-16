'use client'

import { useEffect, useState } from 'react'

import { useAmbientEligibility } from '@/components/useAmbientEligibility'

type AmbientComponent = React.ComponentType

export function DesktopAmbientGate() {
  const isEligible = useAmbientEligibility()
  const [AmbientComponent, setAmbientComponent] = useState<AmbientComponent>()

  useEffect(() => {
    let isCancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if (!isEligible || AmbientComponent) {
      return
    }

    const loadAmbientDecorations = () => {
      import('@/components/AmbientDecorations').then((module) => {
        if (!isCancelled) {
          setAmbientComponent(() => module.default)
        }
      })
    }

    const scheduleImport = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(loadAmbientDecorations, {
          timeout: 5000,
        })
        return
      }

      timeoutId = setTimeout(loadAmbientDecorations, 2200)
    }

    if (document.readyState === 'complete') {
      scheduleImport()
    } else {
      window.addEventListener('load', scheduleImport, { once: true })
    }

    return () => {
      isCancelled = true
      window.removeEventListener('load', scheduleImport)

      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [AmbientComponent, isEligible])

  if (!isEligible || !AmbientComponent) {
    return null
  }

  return <AmbientComponent />
}
