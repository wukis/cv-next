'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useReducer, useState } from 'react'

import {
  animationFocusButtonClassName,
  DesktopTooltip,
  HexagonNetworkIcon,
} from '@/components/HeaderShared'
import { useAmbientEligibility } from '@/components/useAmbientEligibility'
import { TRIGGER_NETWORK_EMERGENCY_EVENT } from '@/lib/ambientCluster'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'
import { deriveAmbientMonitoringState } from '@/lib/ambientMonitoring'

interface TooltipTimerState {
  suppressed: boolean
  expiryKey: number
  durationMs: number | null
}

type TooltipTimerAction =
  | { type: 'activate'; durationMs: number }
  | { type: 'suppress' }

function tooltipTimerReducer(
  state: TooltipTimerState,
  action: TooltipTimerAction,
): TooltipTimerState {
  switch (action.type) {
    case 'activate':
      return {
        suppressed: false,
        expiryKey: state.expiryKey + 1,
        durationMs: action.durationMs,
      }
    case 'suppress':
      return { ...state, suppressed: true }
  }
}

export default function AnimationPreviewButton() {
  const isAmbientEligible = useAmbientEligibility()
  const [isHovering, setIsHovering] = useState(false)
  const [tooltipTimer, dispatchTooltip] = useReducer(tooltipTimerReducer, {
    suppressed: false,
    expiryKey: 0,
    durationMs: null,
  })
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

  const keyboardRotationHint =
    'Use the arrow keys to rotate the cluster while preview is active.'
  const tooltipDescription = useMemo(
    () =>
      isHovering
        ? `${monitoring.buttonDescription} ${keyboardRotationHint}`
        : `Hover to preview cluster pressure paths like surge scaling, reroute pressure, cache warmup misses, and queue buildup. While hovering, scroll to zoom the cluster view. ${keyboardRotationHint}`,
    [isHovering, monitoring.buttonDescription, keyboardRotationHint],
  )

  const tooltipExpiryDuration = useMemo(() => {
    if (monitoring.tooltipExpiryMs != null) {
      return monitoring.tooltipExpiryMs
    }
    const wordCount = tooltipDescription.split(/\s+/).length
    return Math.max(10000, Math.min(30000, (wordCount / 200) * 60000))
  }, [monitoring.tooltipExpiryMs, tooltipDescription])

  useEffect(() => {
    if (!isAmbientEligible || !isHovering) {
      return
    }

    dispatchTooltip({ type: 'activate', durationMs: tooltipExpiryDuration })

    const tooltipFadeTimeout = window.setTimeout(() => {
      dispatchTooltip({ type: 'suppress' })
    }, tooltipExpiryDuration)

    return () => {
      window.clearTimeout(tooltipFadeTimeout)
    }
  }, [isAmbientEligible, isHovering, tooltipDescription, tooltipExpiryDuration])

  if (!isAmbientEligible) {
    return null
  }
  const canTriggerEmergency = cluster.emergencyState === 'normal'

  return (
    <DesktopTooltip
      align="right"
      label={monitoring.buttonLabel}
      description={tooltipDescription}
      isSuppressed={tooltipTimer.suppressed}
      expiryDurationMs={tooltipTimer.durationMs ?? undefined}
      expiryKey={tooltipTimer.expiryKey}
      panelClassName="min-w-[20rem] max-w-104"
    >
      <button
        type="button"
        className={`${animationFocusButtonClassName} h-11 w-11 cursor-pointer`}
        onMouseEnter={() => {
          setIsHovering(true)
        }}
        onMouseLeave={() => {
          setIsHovering(false)
        }}
        onClick={() => {
          if (!canTriggerEmergency) {
            return
          }

          window.dispatchEvent(
            new CustomEvent(TRIGGER_NETWORK_EMERGENCY_EVENT, {
              detail: {
                scenarioKey: 'failover',
                triggerSource: 'button-click',
              },
            }),
          )
        }}
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
