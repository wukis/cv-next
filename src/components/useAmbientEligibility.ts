'use client'

import { useEffect, useState } from 'react'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

type NavigatorWithConnection = Navigator & {
  connection?: {
    addEventListener?: (type: 'change', listener: () => void) => void
    removeEventListener?: (type: 'change', listener: () => void) => void
    saveData?: boolean
  }
}

function getAmbientEligibility() {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithConnection = navigator as NavigatorWithConnection
  const prefersDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  const prefersReducedMotion = window.matchMedia(
    REDUCED_MOTION_MEDIA_QUERY,
  ).matches
  const saveData = navigatorWithConnection.connection?.saveData === true

  return prefersDesktop && !prefersReducedMotion && !saveData
}

export function useAmbientEligibility() {
  const [isEligible, setIsEligible] = useState(false)

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const reducedMotionMediaQuery = window.matchMedia(
      REDUCED_MOTION_MEDIA_QUERY,
    )
    const navigatorWithConnection = navigator as NavigatorWithConnection

    const updateEligibility = () => {
      setIsEligible(getAmbientEligibility())
    }

    updateEligibility()

    desktopMediaQuery.addEventListener('change', updateEligibility)
    reducedMotionMediaQuery.addEventListener('change', updateEligibility)
    navigatorWithConnection.connection?.addEventListener?.(
      'change',
      updateEligibility,
    )

    return () => {
      desktopMediaQuery.removeEventListener('change', updateEligibility)
      reducedMotionMediaQuery.removeEventListener('change', updateEligibility)
      navigatorWithConnection.connection?.removeEventListener?.(
        'change',
        updateEligibility,
      )
    }
  }, [])

  return isEligible
}
