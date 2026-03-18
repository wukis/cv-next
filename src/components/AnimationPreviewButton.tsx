'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'

import {
  animationFocusButtonClassName,
  DesktopTooltip,
  HexagonNetworkIcon,
} from '@/components/HeaderShared'
import { useAmbientEligibility } from '@/components/useAmbientEligibility'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'
import { deriveAmbientMonitoringState } from '@/lib/ambientMonitoring'

export default function AnimationPreviewButton() {
  const isAmbientEligible = useAmbientEligibility()
  const [isHovering, setIsHovering] = useState(false)
  const cluster = useAmbientClusterSnapshot()
  const monitoring = deriveAmbientMonitoringState(cluster)

  useEffect(() => {
    if (!isAmbientEligible) {
      return
    }

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    if (isHovering) {
      document.documentElement.classList.add('animation-focus')
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: true },
        }),
      )
    } else {
      document.documentElement.classList.remove('animation-focus')
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: false },
        }),
      )
    }

    return () => {
      document.documentElement.classList.remove('animation-focus')
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: false },
        }),
      )
    }
  }, [isAmbientEligible, isHovering])

  if (!isAmbientEligible) {
    return null
  }

  const tooltipDescription = isHovering
    ? monitoring.buttonDescription
    : 'Hover to preview cluster pressure paths like surge scaling, reroute pressure, cache warmup misses, and queue buildup. While hovering, scroll to zoom the cluster view and use the arrow keys to rotate the cluster.'

  return (
    <DesktopTooltip
      align="right"
      label={monitoring.buttonLabel}
      description={tooltipDescription}
      panelClassName="min-w-[20rem] max-w-104"
    >
      <button
        type="button"
        className={`${animationFocusButtonClassName} h-11 w-11 cursor-pointer`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        aria-label="Preview background animation"
      >
        <HexagonNetworkIcon
          className={clsx(
            'h-5 w-5 transition-all duration-300',
            isHovering
              ? 'scale-110 text-emerald-500 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-300',
          )}
        />
        <span
          className={clsx(
            'absolute inset-0 rounded-lg ring-2 ring-emerald-400/50 transition-all duration-500',
            isHovering ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          )}
        />
      </button>
    </DesktopTooltip>
  )
}
