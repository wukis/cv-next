'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
  cluster: ReturnType<typeof useAmbientClusterSnapshot>,
  heartbeatLevel: ReturnType<
    typeof deriveAmbientMonitoringState
  >['heartbeatLevel'],
  heartbeatSuffix: ReturnType<
    typeof deriveAmbientMonitoringState
  >['heartbeatSuffix'],
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

export default function LogTerminal() {
  const [shouldRender, setShouldRender] = useState(getShouldRenderLogTerminal)
  const cluster = useAmbientClusterSnapshot()
  const [isDark, setIsDark] = useState(true)
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() =>
    createInitialLogs(),
  )
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastHeartbeatRef = useRef<number>(0)
  const recentLogTimesRef = useRef<number[]>([])
  const singleCopyHeightRef = useRef(INITIAL_LOGS.length * LOG_LINE_HEIGHT_PX)
  const scrollStateRef = useRef({
    currentOffset: 0,
    currentSpeed: 0,
    targetSpeed: 0,
    lastTime: 0,
  })
  const monitoring = deriveAmbientMonitoringState(cluster)

  const checkScreenSize = useCallback(() => {
    setShouldRender(getShouldRenderLogTerminal())
  }, [])

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

  const appendLog = useCallback(
    (entry: LogEntry) => {
      recentLogTimesRef.current.push(entry.timestamp)
      updateScrollCadence(entry.timestamp)
      setLogEntries((previous) => [...previous, entry].slice(-32))
    },
    [updateScrollCadence],
  )

  useEffect(() => {
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [checkScreenSize])

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

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

  useEffect(() => {
    updateScrollCadence(Date.now())
  }, [updateScrollCadence])

  useEffect(() => {
    singleCopyHeightRef.current = Math.max(
      logEntries.length * LOG_LINE_HEIGHT_PX,
      LOG_LINE_HEIGHT_PX,
    )

    const loopHeight = singleCopyHeightRef.current
    const state = scrollStateRef.current

    if (state.currentOffset <= -loopHeight) {
      state.currentOffset = -(-state.currentOffset % loopHeight)
    }

    updateScrollCadence(Date.now())
  }, [logEntries.length, updateScrollCadence])

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

  if (!shouldRender) {
    return null
  }

  const emergencyRedDark = '#ff3333'
  const emergencyRedLight = '#cc0000'
  const recoveryGreenDark = '#33ff66'
  const recoveryGreenLight = '#009933'
  const previewCyanDark = '#4df5ff'
  const previewCyanLight = '#0f766e'
  const surgeSkyDark = '#38bdf8'
  const surgeSkyLight = '#0369a1'

  const getHighlightAccent = (entry: LogEntry) => {
    if (monitoring.accent === 'incident' && entry.level === 'ERROR') {
      return isDark ? emergencyRedDark : emergencyRedLight
    }

    if (monitoring.accent === 'recovery' && entry.level === 'OK') {
      return isDark ? recoveryGreenDark : recoveryGreenLight
    }

    if (monitoring.accent === 'preview' && entry.level === 'INFO') {
      return isDark ? previewCyanDark : previewCyanLight
    }

    if (
      monitoring.accent === 'surge' &&
      (entry.level === 'INFO' || entry.level === 'WARN')
    ) {
      return isDark ? surgeSkyDark : surgeSkyLight
    }

    return null
  }

  const getBaseLogColor = (entry: LogEntry) => {
    if (entry.level === 'ERROR') return isDark ? '#ff6666' : '#cc0000'
    if (entry.level === 'WARN') return isDark ? '#ffaa00' : '#aa6600'
    if (entry.level === 'OK') return isDark ? '#33ff66' : '#009933'
    if (entry.level === 'DEBUG') return isDark ? '#888888' : '#666666'
    return isDark ? '#00cccc' : '#008888'
  }

  const getGlowAccent = (entry: LogEntry) => {
    if (monitoring.accent === 'preview') {
      return null
    }

    return getHighlightAccent(entry)
  }

  const isFocused = monitoring.terminalVisible
  const isActive = isFocused && monitoring.mode !== 'steady'
  const containerOpacity = !isFocused
    ? 0
    : monitoring.mode === 'preview' || monitoring.mode === 'incident'
      ? 1
      : monitoring.mode === 'recovery'
        ? 0.92
        : monitoring.mode === 'surge'
          ? 0.8
          : isDark
            ? 0.15
            : 0.2
  const bgColor = isDark
    ? 'rgba(17, 17, 17, 0.82)'
    : 'rgba(255, 255, 255, 0.88)'
  const borderColor =
    monitoring.mode === 'incident'
      ? isDark
        ? 'rgba(255, 51, 51, 0.5)'
        : 'rgba(204, 0, 0, 0.6)'
      : monitoring.mode === 'recovery'
        ? isDark
          ? 'rgba(51, 255, 102, 0.5)'
          : 'rgba(0, 153, 51, 0.6)'
        : monitoring.mode === 'preview'
          ? isDark
            ? 'rgba(77, 245, 255, 0.45)'
            : 'rgba(15, 118, 110, 0.55)'
          : monitoring.mode === 'surge'
            ? isDark
              ? 'rgba(56, 189, 248, 0.45)'
              : 'rgba(3, 105, 161, 0.55)'
            : isDark
              ? 'rgba(64, 64, 64, 0.3)'
              : 'rgba(180, 180, 180, 0.5)'
  const headerDotColor = isDark ? '#555' : '#ccc'
  const titleColor =
    monitoring.mode === 'incident'
      ? isDark
        ? '#fecaca'
        : '#b91c1c'
      : monitoring.mode === 'recovery'
        ? isDark
          ? '#bbf7d0'
          : '#166534'
        : monitoring.mode === 'preview'
          ? isDark
            ? '#a5f3fc'
            : '#115e59'
          : monitoring.mode === 'surge'
            ? isDark
              ? '#bae6fd'
              : '#075985'
            : isDark
              ? '#94a3b8'
              : '#475569'
  const panelAccentColor =
    monitoring.mode === 'incident'
      ? isDark
        ? 'rgba(255, 51, 51, 0.42)'
        : 'rgba(204, 0, 0, 0.34)'
      : monitoring.mode === 'recovery'
        ? isDark
          ? 'rgba(51, 255, 102, 0.36)'
          : 'rgba(0, 153, 51, 0.28)'
        : monitoring.mode === 'preview'
          ? isDark
            ? 'rgba(77, 245, 255, 0.3)'
            : 'rgba(15, 118, 110, 0.24)'
          : monitoring.mode === 'surge'
            ? isDark
              ? 'rgba(56, 189, 248, 0.3)'
              : 'rgba(3, 105, 161, 0.24)'
            : isDark
              ? 'rgba(148, 163, 184, 0.16)'
              : 'rgba(148, 163, 184, 0.18)'

  const formattedLogs = logEntries.map((entry) => ({
    id: entry.id,
    text: `${formatTimestamp(entry.timestamp)} ${entry.level.padEnd(5, ' ')} ${entry.message}`,
    highlightAccent: getHighlightAccent(entry),
    glowAccent: getGlowAccent(entry),
    color: getHighlightAccent(entry) ?? getBaseLogColor(entry),
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-end justify-center overflow-hidden pb-4">
      <div
        className="overflow-hidden rounded-lg"
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
                    ? isDark
                      ? emergencyRedDark
                      : emergencyRedLight
                    : headerDotColor,
              }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  monitoring.mode === 'recovery'
                    ? isDark
                      ? recoveryGreenDark
                      : recoveryGreenLight
                    : headerDotColor,
              }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  monitoring.mode === 'preview'
                    ? isDark
                      ? previewCyanDark
                      : previewCyanLight
                    : monitoring.mode === 'surge'
                      ? isDark
                        ? surgeSkyDark
                        : surgeSkyLight
                      : headerDotColor,
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
                  <div
                    key={`${copyIndex}-${entry.id}`}
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
      </div>
    </div>
  )
}
