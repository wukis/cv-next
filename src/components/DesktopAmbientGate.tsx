'use client'

import { useEffect, useState } from 'react'

import { useAmbientEligibility } from '@/components/useAmbientEligibility'

type AmbientComponent = React.ComponentType

export function DesktopAmbientGate() {
  const isEligible = useAmbientEligibility()
  const [AmbientComponent, setAmbientComponent] = useState<AmbientComponent>()

  useEffect(() => {
    let isCancelled = false

    if (!isEligible || AmbientComponent) {
      return
    }

    import('@/components/AmbientDecorations').then((module) => {
      if (!isCancelled) {
        setAmbientComponent(() => module.default)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [AmbientComponent, isEligible])

  if (!isEligible || !AmbientComponent) {
    return null
  }

  return <AmbientComponent />
}
