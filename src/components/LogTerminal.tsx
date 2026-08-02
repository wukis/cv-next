'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import {
  useBrowserDarkMode,
  useWindowResizeHandler,
} from '@/components/browserState'
import {
  type ClusterEventEntry,
  NETWORK_CLUSTER_EVENT,
} from '@/lib/ambientCluster'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'
import { deriveAmbientMonitoringState } from '@/lib/ambientMonitoring'

type LogEntry = {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'OK' | 'DEBUG'
  message: string
  timestamp: number
}

type AmbientMonitoringState = ReturnType<typeof deriveAmbientMonitoringState>
type AmbientClusterSnapshot = ReturnType<typeof useAmbientClusterSnapshot>

type TerminalMode = AmbientMonitoringState['mode']

type ThemePalette = {
  emergencyRed: string
  recoveryGreen: string
  previewCyan: string
  surgeSky: string
  headerDot: string
}

type FormattedLogEntry = {
  id: string
  text: string
  highlightAccent: string | null
  glowAccent: string | null
  color: string
}

const INITIAL_LOGS: Array<Pick<LogEntry, 'level' | 'message'>> = [
  {
    level: 'INFO',
    message: 'Ingress accepted request burst from edge clients source=public',
  },
  {
    level: 'INFO',
    message:
      'LoadBalancer routed request service=edge target=edge-1 latency_ms=9',
  },
  {
    level: 'OK',
    message:
      'Deployments edge=2 auth=1 catalog=1 basket=1 checkout=1 warehouse=1 all ready',
  },
  {
    level: 'DEBUG',
    message:
      'RedisCluster master=redis-m replicas=2 hit_ratio=96.4% namespace=prod',
  },
  { level: 'INFO', message: 'Queue depth stabilized topic=jobs backlog=8' },
  {
    level: 'INFO',
    message: 'Postgres primary healthy wal_replication=1 follower',
  },
  {
    level: 'OK',
    message:
      'Kubelet readiness passed pod=checkout-1 namespace=prod restart_count=0',
  },
  {
    level: 'DEBUG',
    message: 'Tracing exported span_count=148 collector=metrics',
  },
  {
    level: 'INFO',
    message:
      'ServiceMesh local call checkout-1 -> basket-1 -> warehouse-1 latency_ms=7',
  },
  {
    level: 'OK',
    message:
      'Autoscaler steady state confirmed pending_replicas=0 desired_services=6',
  },
  {
    level: 'DEBUG',
    message: 'Worker consumer acknowledged batch size=24 topic=jobs',
  },
  {
    level: 'INFO',
    message:
      'Warehouse availability service refreshed sku_count=128 source=erp',
  },
  {
    level: 'INFO',
    message:
      'Redis replication healthy master=redis-m followers=redis-r1,redis-r2 lag_ms=3',
  },
  { level: 'OK', message: 'Ingress health probe passed endpoint=/readyz' },
  {
    level: 'DEBUG',
    message:
      'Service mesh sampled trace route=lb-ext/edge/basket/checkout/warehouse-1/pg-replica',
  },
]

const LOG_SCROLL_DURATION_MIN_MS = 12000
const LOG_SCROLL_DURATION_MAX_MS = 28000
const LOG_ACTIVITY_WINDOW_MS = 14000
const LOG_ACTIVITY_BASELINE_COUNT = 2
const LOG_ACTIVITY_PEAK_COUNT = 8
const LOG_LINE_HEIGHT_PX = 18

const THEME_PALETTES = {
  dark: {
    emergencyRed: '#ff3333',
    recoveryGreen: '#33ff66',
    previewCyan: '#4df5ff',
    surgeSky: '#38bdf8',
    headerDot: '#555',
  },
  light: {
    emergencyRed: '#cc0000',
    recoveryGreen: '#009933',
    previewCyan: '#0f766e',
    surgeSky: '#0369a1',
    headerDot: '#ccc',
  },
} satisfies Record<'dark' | 'light', ThemePalette>

const MODE_THEME = {
  incident: {
    title: ['#fecaca', '#b91c1c'],
    border: ['rgba(255, 51, 51, 0.5)', 'rgba(204, 0, 0, 0.6)'],
    accent: ['rgba(255, 51, 51, 0.42)', 'rgba(204, 0, 0, 0.34)'],
  },
  recovery: {
    title: ['#bbf7d0', '#166534'],
    border: ['rgba(51, 255, 102, 0.5)', 'rgba(0, 153, 51, 0.6)'],
    accent: ['rgba(51, 255, 102, 0.36)', 'rgba(0, 153, 51, 0.28)'],
  },
  preview: {
    title: ['#a5f3fc', '#115e59'],
    border: ['rgba(77, 245, 255, 0.45)', 'rgba(15, 118, 110, 0.55)'],
    accent: ['rgba(77, 245, 255, 0.3)', 'rgba(15, 118, 110, 0.24)'],
  },
  surge: {
    title: ['#bae6fd', '#075985'],
    border: ['rgba(56, 189, 248, 0.45)', 'rgba(3, 105, 161, 0.55)'],
    accent: ['rgba(56, 189, 248, 0.3)', 'rgba(3, 105, 161, 0.24)'],
  },
  steady: {
    title: ['#94a3b8', '#475569'],
    border: ['rgba(64, 64, 64, 0.3)', 'rgba(180, 180, 180, 0.5)'],
    accent: ['rgba(148, 163, 184, 0.16)', 'rgba(148, 163, 184, 0.18)'],
  },
} satisfies Record<
  TerminalMode,
  {
    title: [string, string]
    border: [string, string]
    accent: [string, string]
  }
>

const BASE_LOG_COLORS = {
  ERROR: ['#ff6666', '#cc0000'],
  WARN: ['#ffaa00', '#aa6600'],
  OK: ['#33ff66', '#009933'],
  DEBUG: ['#888888', '#666666'],
  INFO: ['#00cccc', '#008888'],
} satisfies Record<LogEntry['level'], [string, string]>

const HIGHLIGHT_ACCENTS: Partial<
  Record<
    AmbientMonitoringState['accent'],
    { level: LogEntry['level']; paletteKey: keyof ThemePalette }
  >
> = {
  incident: { level: 'ERROR', paletteKey: 'emergencyRed' },
  recovery: { level: 'OK', paletteKey: 'recoveryGreen' },
  preview: { level: 'INFO', paletteKey: 'previewCyan' },
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString()
}

function createInitialLogs() {
  const baseTime = Date.now()
  return INITIAL_LOGS.map((entry, index) => ({
    id: `seed-${index}`,
    level: entry.level,
    message: entry.message,
    timestamp: baseTime - (INITIAL_LOGS.length - index) * 2200,
  }))
}

function getShouldRenderLogTerminal() {
  if (typeof window === 'undefined') {
    return false
  }

  const width = window.innerWidth
  const height = window.innerHeight
  return width > 1200 && width / height > 1.4
}

function mapClusterEventToLog(event: ClusterEventEntry): LogEntry {
  const levelMap: Record<ClusterEventEntry['level'], LogEntry['level']> = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    success: 'OK',
  }

  return {
    id: `event-${event.id}`,
    level: levelMap[event.level],
    message: event.message,
    timestamp: event.timestamp,
  }
}

function createHeartbeatLog(
  cluster: AmbientClusterSnapshot,
  heartbeatLevel: AmbientMonitoringState['heartbeatLevel'],
  heartbeatSuffix: AmbientMonitoringState['heartbeatSuffix'],
) {
  return {
    id: `heartbeat-${Date.now()}`,
    level: heartbeatLevel,
    message:
      `Cluster heartbeat ready=${cluster.readyReplicas}/${cluster.replicaTarget}` +
      ` targets=${cluster.loadBalancerTargets.length}` +
      ` queue_depth=${cluster.queueDepth}${heartbeatSuffix}`,
    timestamp: Date.now(),
  } satisfies LogEntry
}

function getThemePalette(isDark: boolean) {
  return THEME_PALETTES[isDark ? 'dark' : 'light']
}

function pickThemeValue(values: [string, string], isDark: boolean) {
  return values[isDark ? 0 : 1]
}

function getTerminalModeTheme(mode: TerminalMode, isDark: boolean) {
  const modeTheme = MODE_THEME[mode]
  return {
    titleColor: pickThemeValue(modeTheme.title, isDark),
    borderColor: pickThemeValue(modeTheme.border, isDark),
    panelAccentColor: pickThemeValue(modeTheme.accent, isDark),
  }
}

function getTerminalOpacity(
  monitoring: Pick<AmbientMonitoringState, 'mode' | 'terminalVisible'>,
  isDark: boolean,
) {
  if (!monitoring.terminalVisible) return 0

  const modeOpacity = {
    incident: 1,
    preview: 1,
    recovery: 0.92,
    surge: 0.8,
    steady: isDark ? 0.15 : 0.2,
  } satisfies Record<TerminalMode, number>

  return modeOpacity[monitoring.mode]
}

function getHighlightAccent(
  entry: LogEntry,
  monitoring: Pick<AmbientMonitoringState, 'accent'>,
  palette: ThemePalette,
) {
  if (monitoring.accent === 'surge') {
    return entry.level === 'INFO' || entry.level === 'WARN'
      ? palette.surgeSky
      : null
  }

  const highlight = HIGHLIGHT_ACCENTS[monitoring.accent]
  return highlight && entry.level === highlight.level
    ? palette[highlight.paletteKey]
    : null
}

function getBaseLogColor(entry: LogEntry, isDark: boolean) {
  return pickThemeValue(BASE_LOG_COLORS[entry.level], isDark)
}

function formatLogEntries(
  entries: LogEntry[],
  monitoring: Pick<AmbientMonitoringState, 'accent'>,
  palette: ThemePalette,
  isDark: boolean,
): FormattedLogEntry[] {
  return entries.map((entry) => {
    const highlightAccent = getHighlightAccent(entry, monitoring, palette)
    const glowAccent = monitoring.accent === 'preview' ? null : highlightAccent

    return {
      id: entry.id,
      text: `${formatTimestamp(entry.timestamp)} ${entry.level.padEnd(5, ' ')} ${entry.message}`,
      highlightAccent,
      glowAccent,
      color: highlightAccent ?? getBaseLogColor(entry, isDark),
    }
  })
}

function useLogTerminalEntries(
  cluster: AmbientClusterSnapshot,
  monitoring: Pick<
    AmbientMonitoringState,
    'heartbeatLevel' | 'heartbeatSuffix'
  >,
  recordLogActivity: (timestamp: number) => void,
  setLoopLogCount: (logCount: number) => void,
) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() =>
    createInitialLogs(),
  )
  const lastHeartbeatRef = useRef<number>(0)

  const appendLog = useCallback(
    (entry: LogEntry) => {
      recordLogActivity(entry.timestamp)
      setLogEntries((previous) => {
        const nextEntries = [...previous, entry].slice(-32)
        setLoopLogCount(nextEntries.length)
        return nextEntries
      })
    },
    [recordLogActivity, setLoopLogCount],
  )

  useEffect(() => {
    const handleClusterEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ClusterEventEntry>
      if (!customEvent.detail) {
        return
      }

      appendLog(mapClusterEventToLog(customEvent.detail))
    }

    window.addEventListener(NETWORK_CLUSTER_EVENT, handleClusterEvent)
    return () =>
      window.removeEventListener(NETWORK_CLUSTER_EVENT, handleClusterEvent)
  }, [appendLog])

  useEffect(() => {
    let frameId = 0

    const now = Date.now()
    if (now - lastHeartbeatRef.current > 8500) {
      lastHeartbeatRef.current = now
      frameId = window.requestAnimationFrame(() => {
        appendLog(
          createHeartbeatLog(
            cluster,
            monitoring.heartbeatLevel,
            monitoring.heartbeatSuffix,
          ),
        )
      })
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [
    appendLog,
    monitoring.heartbeatLevel,
    monitoring.heartbeatSuffix,
    cluster,
  ])

  return logEntries
}

function useLogTerminalScroll(shouldRender: boolean) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const recentLogTimesRef = useRef<number[]>([])
  const singleCopyHeightRef = useRef(INITIAL_LOGS.length * LOG_LINE_HEIGHT_PX)
  const scrollStateRef = useRef({
    currentOffset: 0,
    currentSpeed: 0,
    targetSpeed: 0,
    lastTime: 0,
  })

  const updateScrollCadence = useCallback((timestamp: number) => {
    recentLogTimesRef.current = recentLogTimesRef.current.filter(
      (loggedAt) => timestamp - loggedAt <= LOG_ACTIVITY_WINDOW_MS,
    )

    const activityCount = recentLogTimesRef.current.length
    const normalizedActivity = Math.min(
      1,
      Math.max(
        0,
        (activityCount - LOG_ACTIVITY_BASELINE_COUNT) /
          (LOG_ACTIVITY_PEAK_COUNT - LOG_ACTIVITY_BASELINE_COUNT),
      ),
    )
    const durationMs =
      LOG_SCROLL_DURATION_MAX_MS -
      normalizedActivity *
        (LOG_SCROLL_DURATION_MAX_MS - LOG_SCROLL_DURATION_MIN_MS)

    const singleCopyHeight = Math.max(
      singleCopyHeightRef.current,
      LOG_LINE_HEIGHT_PX,
    )
    scrollStateRef.current.targetSpeed = singleCopyHeight / durationMs
  }, [])

  const recordLogActivity = useCallback(
    (timestamp: number) => {
      recentLogTimesRef.current.push(timestamp)
      updateScrollCadence(timestamp)
    },
    [updateScrollCadence],
  )

  const setLoopLogCount = useCallback(
    (logCount: number) => {
      singleCopyHeightRef.current = Math.max(
        logCount * LOG_LINE_HEIGHT_PX,
        LOG_LINE_HEIGHT_PX,
      )
      updateScrollCadence(Date.now())
    },
    [updateScrollCadence],
  )

  useEffect(() => {
    updateScrollCadence(Date.now())
  }, [updateScrollCadence])

  useEffect(() => {
    const loopHeight = singleCopyHeightRef.current
    const state = scrollStateRef.current

    if (state.currentOffset <= -loopHeight) {
      state.currentOffset = -(-state.currentOffset % loopHeight)
    }

    updateScrollCadence(Date.now())
  }, [updateScrollCadence])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    const state = scrollStateRef.current
    updateScrollCadence(Date.now())
    state.currentSpeed = state.targetSpeed
    state.lastTime = performance.now()

    const animate = (currentTime: number) => {
      updateScrollCadence(Date.now())

      const deltaTime = currentTime - state.lastTime
      state.lastTime = currentTime

      const lerpFactor = Math.min(1, 0.02 * (deltaTime / 16))
      state.currentSpeed +=
        (state.targetSpeed - state.currentSpeed) * lerpFactor
      state.currentOffset -= state.currentSpeed * deltaTime

      const loopHeight = singleCopyHeightRef.current
      if (state.currentOffset <= -loopHeight) {
        state.currentOffset += loopHeight
      }

      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.transform = `translateY(${state.currentOffset}px)`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [shouldRender, updateScrollCadence])

  return {
    recordLogActivity,
    scrollContainerRef,
    setLoopLogCount,
    updateScrollCadence,
  }
}

function useShouldRenderTerminal() {
  const [shouldRender, setShouldRender] = useState(getShouldRenderLogTerminal)

  const checkScreenSize = useCallback(() => {
    setShouldRender(getShouldRenderLogTerminal())
  }, [])

  useWindowResizeHandler(checkScreenSize)

  return shouldRender
}

function TerminalHeader({
  isDark,
  monitoring,
  palette,
  titleColor,
}: {
  isDark: boolean
  monitoring: AmbientMonitoringState
  palette: ThemePalette
  titleColor: string
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{
        borderBottom: `1px solid ${isDark ? 'rgba(64, 64, 64, 0.3)' : 'rgba(180, 180, 180, 0.5)'}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor:
              monitoring.mode === 'incident'
                ? palette.emergencyRed
                : palette.headerDot,
          }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor:
              monitoring.mode === 'recovery'
                ? palette.recoveryGreen
                : palette.headerDot,
          }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: getHeaderStatusDotColor(monitoring.mode, palette),
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-[10px] tracking-[0.18em] uppercase"
          style={{ color: titleColor }}
        >
          {monitoring.terminalTitle}
        </span>
        {monitoring.mode !== 'steady' ? (
          <span
            className="font-mono text-[9px] tracking-[0.18em] uppercase"
            style={{
              color: titleColor,
              opacity: 0.75,
            }}
          >
            {monitoring.statusPill}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function getHeaderStatusDotColor(
  mode: AmbientMonitoringState['mode'],
  palette: ThemePalette,
) {
  if (mode === 'preview') {
    return palette.previewCyan
  }

  if (mode === 'surge') {
    return palette.surgeSky
  }

  return palette.headerDot
}

function LogLine({
  entry,
  isActive,
  isDark,
}: {
  entry: FormattedLogEntry
  isActive: boolean
  isDark: boolean
}) {
  return (
    <div
      className="whitespace-nowrap"
      style={{
        color: entry.color,
        textShadow:
          isActive && isDark && entry.glowAccent
            ? `0 0 4px ${entry.glowAccent}`
            : 'none',
      }}
    >
      {entry.text}
    </div>
  )
}

function LogTerminalBody({
  formattedLogs,
  isActive,
  isDark,
  scrollContainerRef,
}: {
  formattedLogs: FormattedLogEntry[]
  isActive: boolean
  isDark: boolean
  scrollContainerRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 'calc(100% - 33px)' }}
    >
      <div
        ref={scrollContainerRef}
        className="px-3 font-mono text-[0.7rem]"
        style={{ willChange: 'transform' }}
      >
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            style={{ lineHeight: `${LOG_LINE_HEIGHT_PX}px` }}
          >
            {formattedLogs.map((entry) => (
              <LogLine
                key={`${copyIndex}-${entry.id}`}
                entry={entry}
                isActive={isActive}
                isDark={isDark}
              />
            ))}
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-12"
        style={{
          background: isDark
            ? 'linear-gradient(to top, rgba(17, 17, 17, 1) 0%, rgba(17, 17, 17, 0) 100%)'
            : 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
        }}
      />
    </div>
  )
}

export default function LogTerminal() {
  const shouldRender = useShouldRenderTerminal()
  const cluster = useAmbientClusterSnapshot()
  const isDark = useBrowserDarkMode()
  const monitoring = deriveAmbientMonitoringState(cluster)
  const { recordLogActivity, scrollContainerRef, setLoopLogCount } =
    useLogTerminalScroll(shouldRender)
  const logEntries = useLogTerminalEntries(
    cluster,
    monitoring,
    recordLogActivity,
    setLoopLogCount,
  )

  if (!shouldRender) {
    return null
  }

  const palette = getThemePalette(isDark)
  const isFocused = monitoring.terminalVisible
  const isActive = isFocused && monitoring.mode !== 'steady'
  const containerOpacity = getTerminalOpacity(monitoring, isDark)
  const bgColor = isDark
    ? 'rgba(17, 17, 17, 0.82)'
    : 'rgba(255, 255, 255, 0.88)'
  const { borderColor, panelAccentColor, titleColor } = getTerminalModeTheme(
    monitoring.mode,
    isDark,
  )
  const formattedLogs = formatLogEntries(
    logEntries,
    monitoring,
    palette,
    isDark,
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-end justify-center overflow-hidden pb-4">
      <div
        className="overflow-hidden rounded-sm"
        style={{
          width: '720px',
          height: '190px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          opacity: containerOpacity,
          transition: isFocused
            ? 'opacity 0.3s ease-in'
            : 'opacity 0.5s ease-out',
          boxShadow: `0 0 0 1px ${isActive ? panelAccentColor : borderColor}, 0 24px 60px ${
            isDark ? 'rgba(2, 6, 23, 0.44)' : 'rgba(15, 23, 42, 0.14)'
          }`,
        }}
      >
        <TerminalHeader
          isDark={isDark}
          monitoring={monitoring}
          palette={palette}
          titleColor={titleColor}
        />
        <LogTerminalBody
          formattedLogs={formattedLogs}
          isActive={isActive}
          isDark={isDark}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
    </div>
  )
}
