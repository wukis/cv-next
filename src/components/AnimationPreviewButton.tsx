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
  { type: 'activate'; durationMs: number } | { type: 'suppress' }

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

function dispatchAnimationFocusHover(isHovering: boolean) {
  window.dispatchEvent(
    new CustomEvent('animation-focus-hover', {
      detail: { isHovering },
    }),
  )
}

function restoreAnimationFocus() {
  document.documentElement.classList.remove('animation-focus')
  dispatchAnimationFocusHover(false)
}

function getTooltipDescription(
  isHovering: boolean,
  buttonDescription: string,
  keyboardRotationHint: string,
) {
  if (isHovering) {
    return `${buttonDescription} ${keyboardRotationHint}`
  }

  return `Hover to preview cluster pressure paths like surge scaling, reroute pressure, cache warmup misses, and queue buildup. While hovering, scroll to zoom the cluster view. ${keyboardRotationHint}`
}

function getTooltipExpiryDuration(
  explicitDurationMs: number | null,
  tooltipDescription: string,
) {
  if (explicitDurationMs != null) {
    return explicitDurationMs
  }

  const wordCount = tooltipDescription.split(/\s+/).length
  return Math.max(10000, Math.min(30000, (wordCount / 200) * 60000))
}

function triggerManualEmergency(canTriggerEmergency: boolean) {
  if (!canTriggerEmergency) return

  window.dispatchEvent(
    new CustomEvent(TRIGGER_NETWORK_EMERGENCY_EVENT, {
      detail: {
        scenarioKey: 'failover',
        triggerSource: 'button-click',
      },
    }),
  )
}

function AnimationPreviewIcon({
  orbitKey,
  orbitActive,
  isHovering,
}: {
  orbitKey: number
  orbitActive: boolean
  isHovering: boolean
}) {
  return (
    <>
      <HexagonNetworkIcon
        key={orbitKey}
        orbitActive={orbitActive}
        className={clsx(
          'h-5 w-5 transition-[color,transform] duration-300',
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
    </>
  )
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

    if (isHovering) {
      document.documentElement.classList.add('animation-focus')
      window.dispatchEvent(
        new CustomEvent('animation-focus-hover', {
          detail: { isHovering: true },
        }),
      )
    } else {
      restoreAnimationFocus()
    }

    return () => {
      restoreAnimationFocus()
    }
  }, [isAmbientEligible, isHovering])

  const keyboardRotationHint =
    'Use the arrow keys to rotate the cluster while preview is active.'
  const tooltipDescription = useMemo(
    () =>
      getTooltipDescription(
        isHovering,
        monitoring.buttonDescription,
        keyboardRotationHint,
      ),
    [isHovering, monitoring.buttonDescription, keyboardRotationHint],
  )

  const tooltipExpiryDuration = useMemo(
    () =>
      getTooltipExpiryDuration(monitoring.tooltipExpiryMs, tooltipDescription),
    [monitoring.tooltipExpiryMs, tooltipDescription],
  )

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

  const [orbitKey, setOrbitKey] = useState(0)
  const [orbitActive, setOrbitActive] = useState(false)

  useEffect(() => {
    if (!isAmbientEligible || isHovering || orbitActive) return

    const timerId = window.setTimeout(() => {
      setOrbitKey((k) => k + 1)
      setOrbitActive(true)
    }, 10_000)
    return () => window.clearTimeout(timerId)
  }, [isAmbientEligible, isHovering, orbitActive])

  useEffect(() => {
    if (!orbitActive) return

    const endTimer = window.setTimeout(() => {
      setOrbitActive(false)
    }, 6000)
    return () => window.clearTimeout(endTimer)
  }, [orbitActive])

  if (!isAmbientEligible) {
    return null
  }
  const canTriggerEmergency = cluster.emergencyState === 'normal'
  const tooltipTimingProps =
    tooltipTimer.durationMs == null
      ? {}
      : { expiryDurationMs: tooltipTimer.durationMs }

  return (
    <DesktopTooltip
      align="right"
      label={monitoring.buttonLabel}
      description={tooltipDescription}
      isSuppressed={tooltipTimer.suppressed}
      expiryKey={tooltipTimer.expiryKey}
      panelClassName="min-w-[20rem] max-w-104"
      {...tooltipTimingProps}
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
          triggerManualEmergency(canTriggerEmergency)
        }}
        aria-label="Preview background animation"
      >
        <AnimationPreviewIcon
          orbitKey={orbitKey}
          orbitActive={orbitActive}
          isHovering={isHovering}
        />
      </button>
    </DesktopTooltip>
  )
}
