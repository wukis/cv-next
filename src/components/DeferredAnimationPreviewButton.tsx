'use client'

import { useEffect, useState } from 'react'

import { useAmbientEligibility } from '@/components/useAmbientEligibility'

type AnimationPreviewButtonComponent = React.ComponentType

export default function DeferredAnimationPreviewButton() {
  const isAmbientEligible = useAmbientEligibility()
  const [AnimationPreviewButton, setAnimationPreviewButton] =
    useState<AnimationPreviewButtonComponent>()

  useEffect(() => {
    if (!isAmbientEligible || AnimationPreviewButton) {
      return
    }

    let isCancelled = false
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const loadPreviewButton = () => {
      void import('@/components/AnimationPreviewButton').then((module) => {
        if (!isCancelled) {
          setAnimationPreviewButton(() => module.default)
        }
      })
    }

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadPreviewButton, { timeout: 1800 })
    } else {
      timeoutId = setTimeout(loadPreviewButton, 1800)
    }

    return () => {
      isCancelled = true
      if (idleId != null) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
    }
  }, [AnimationPreviewButton, isAmbientEligible])

  if (!isAmbientEligible || !AnimationPreviewButton) {
    return null
  }

  return <AnimationPreviewButton />
}
