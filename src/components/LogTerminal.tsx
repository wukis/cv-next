'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DEFAULT_CLUSTER_SNAPSHOT,
  NETWORK_CLUSTER_STATE_EVENT,
  type ClusterEventEntry,
  type ClusterSnapshot,
  type EmergencyState,
} from '@/lib/ambientCluster'

type LogEntry = {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'OK' | 'DEBUG'
  message: string
  timestamp: number
}

const INITIAL_LOGS: Array<Pick<LogEntry, 'level' | 'message'>> = [
  { level: 'INFO', message: 'Ingress accepted request burst from edge clients source=public' },
  { level: 'INFO', message: 'LoadBalancer routed request service=edge target=edge-1 latency_ms=9' },
  { level: 'OK', message: 'Deployments edge=2 auth=1 catalog=1 basket=1 checkout=1 warehouse=1 all ready' },
  { level: 'DEBUG', message: 'RedisCluster master=redis-m replicas=2 hit_ratio=96.4% namespace=prod' },
  { level: 'INFO', message: 'Queue depth stabilized topic=jobs backlog=8' },
  { level: 'INFO', message: 'Postgres primary healthy wal_replication=1 follower' },
  { level: 'OK', message: 'Kubelet readiness passed pod=checkout-1 namespace=prod restart_count=0' },
  { level: 'DEBUG', message: 'Tracing exported span_count=148 collector=metrics' },
  { level: 'INFO', message: 'ServiceMesh local call checkout-1 -> basket-1 -> warehouse-1 latency_ms=7' },
  { level: 'OK', message: 'Autoscaler steady state confirmed pending_replicas=0 desired_services=6' },
  { level: 'DEBUG', message: 'Worker consumer acknowledged batch size=24 topic=jobs' },
  { level: 'INFO', message: 'Warehouse availability service refreshed sku_count=128 source=erp' },
  { level: 'INFO', message: 'Redis replication healthy master=redis-m followers=redis-r1,redis-r2 lag_ms=3' },
  { level: 'OK', message: 'Ingress health probe passed endpoint=/readyz' },
  { level: 'DEBUG', message: 'Service mesh sampled trace route=lb-ext/edge/basket/checkout/warehouse-1/pg-replica' },
]

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

function createHeartbeatLog(cluster: ClusterSnapshot) {
  const emergencySuffix =
    cluster.emergencyState === 'emergency'
      ? ' incident=active'
      : cluster.emergencyState === 'recovery'
        ? ' incident=recovering'
        : ''

  return {
    id: `heartbeat-${Date.now()}`,
    level: cluster.readyReplicas < cluster.replicaTarget ? 'WARN' : 'DEBUG',
    message:
      `Cluster heartbeat ready=${cluster.readyReplicas}/${cluster.replicaTarget}` +
      ` targets=${cluster.loadBalancerTargets.length} queue_depth=${cluster.queueDepth}${emergencySuffix}`,
    timestamp: Date.now(),
  } satisfies LogEntry
}

export default function LogTerminal() {
  const [shouldRender, setShouldRender] = useState(getShouldRenderLogTerminal)
  const [isFocused, setIsFocused] = useState(false)
  const [cluster, setCluster] = useState<ClusterSnapshot>(DEFAULT_CLUSTER_SNAPSHOT)
  const [isDark, setIsDark] = useState(true)
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() => createInitialLogs())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastEventIdRef = useRef<number>(0)
  const lastHeartbeatRef = useRef<number>(0)
  const scrollStateRef = useRef({
    currentOffset: 0,
    currentSpeed: 0,
    targetSpeed: 0,
    lastTime: 0,
  })

  const checkScreenSize = useCallback(() => {
    setShouldRender(getShouldRenderLogTerminal())
  }, [])

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
    const checkFocusClass = () => {
      setIsFocused(document.documentElement.classList.contains('animation-focus'))
    }

    checkFocusClass()

    const observer = new MutationObserver(checkFocusClass)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const appendLog = (entry: LogEntry) => {
      setLogEntries((previous) => [...previous, entry].slice(-32))
    }

    const handleClusterUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClusterSnapshot>
      const snapshot = customEvent.detail
      if (!snapshot) {
        return
      }

      setCluster(snapshot)

      if (
        snapshot.recentEvent &&
        snapshot.recentEvent.id !== lastEventIdRef.current
      ) {
        lastEventIdRef.current = snapshot.recentEvent.id
        appendLog(mapClusterEventToLog(snapshot.recentEvent))
        return
      }

      const now = Date.now()
      if (now - lastHeartbeatRef.current > 8500) {
        lastHeartbeatRef.current = now
        appendLog(createHeartbeatLog(snapshot))
      }
    }

    window.addEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
    return () => window.removeEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
  }, [])

  const getTargetScrollSpeed = useCallback(() => {
    const emergencyState: EmergencyState = cluster.emergencyState
    const durationMs =
      emergencyState === 'emergency'
        ? isFocused
          ? 11000
          : 32000
        : emergencyState === 'recovery'
          ? isFocused
            ? 16000
            : 42000
          : isFocused
            ? 19000
            : 60000

    return 50 / durationMs
  }, [cluster.emergencyState, isFocused])

  useEffect(() => {
    scrollStateRef.current.targetSpeed = getTargetScrollSpeed()
  }, [getTargetScrollSpeed])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    const state = scrollStateRef.current
    state.targetSpeed = getTargetScrollSpeed()
    state.currentSpeed = state.targetSpeed
    state.lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - state.lastTime
      state.lastTime = currentTime

      const lerpFactor = Math.min(1, 0.02 * (deltaTime / 16))
      state.currentSpeed += (state.targetSpeed - state.currentSpeed) * lerpFactor
      state.currentOffset -= state.currentSpeed * deltaTime

      if (state.currentOffset <= -50) {
        state.currentOffset += 50
      }

      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.transform = `translateY(${state.currentOffset}%)`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [getTargetScrollSpeed, shouldRender])

  if (!shouldRender) {
    return null
  }

  const emergencyRedDark = '#ff3333'
  const emergencyRedLight = '#cc0000'
  const recoveryGreenDark = '#33ff66'
  const recoveryGreenLight = '#009933'

  const getLogColor = (entry: LogEntry) => {
    if (cluster.emergencyState === 'emergency' && entry.level !== 'OK') {
      return isDark ? emergencyRedDark : emergencyRedLight
    }

    if (cluster.emergencyState === 'recovery' && entry.level === 'OK') {
      return isDark ? recoveryGreenDark : recoveryGreenLight
    }

    if (entry.level === 'ERROR') return isDark ? '#ff6666' : '#cc0000'
    if (entry.level === 'WARN') return isDark ? '#ffaa00' : '#aa6600'
    if (entry.level === 'OK') return isDark ? '#33ff66' : '#009933'
    if (entry.level === 'DEBUG') return isDark ? '#888888' : '#666666'
    return isDark ? '#00cccc' : '#008888'
  }

  const containerOpacity = isFocused ? 1 : isDark ? 0.15 : 0.2
  const bgColor = isDark ? 'rgba(17, 17, 17, 0.82)' : 'rgba(255, 255, 255, 0.88)'
  const borderColor =
    cluster.emergencyState === 'emergency'
      ? isDark
        ? 'rgba(255, 51, 51, 0.5)'
        : 'rgba(204, 0, 0, 0.6)'
      : cluster.emergencyState === 'recovery'
        ? isDark
          ? 'rgba(51, 255, 102, 0.5)'
          : 'rgba(0, 153, 51, 0.6)'
        : isDark
          ? 'rgba(64, 64, 64, 0.3)'
          : 'rgba(180, 180, 180, 0.5)'
  const headerDotColor = isDark ? '#555' : '#ccc'
  const terminalTitle =
    cluster.emergencyState === 'emergency'
      ? 'cluster://prod failover'
      : cluster.emergencyState === 'recovery'
        ? 'cluster://prod healing'
        : 'cluster://prod steady-state'

  const formattedLogs = logEntries.map((entry) => ({
    id: entry.id,
    text: `${formatTimestamp(entry.timestamp)} ${entry.level.padEnd(5, ' ')} ${entry.message}`,
    color: getLogColor(entry),
  }))

  return (
    <div className="fixed inset-0 z-0 flex items-end justify-center overflow-hidden pb-4 pointer-events-none">
      <div
        className="overflow-hidden rounded-lg"
        style={{
          width: '720px',
          height: '190px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          opacity: containerOpacity,
          transition: isFocused ? 'opacity 0.3s ease-in' : 'opacity 0.5s ease-out',
          boxShadow:
            cluster.emergencyState === 'emergency' && isFocused
              ? `0 0 20px ${isDark ? 'rgba(255, 51, 51, 0.3)' : 'rgba(204, 0, 0, 0.2)'}`
              : cluster.emergencyState === 'recovery' && isFocused
                ? `0 0 20px ${isDark ? 'rgba(51, 255, 102, 0.28)' : 'rgba(0, 153, 51, 0.18)'}`
                : 'none',
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
                  cluster.emergencyState === 'emergency'
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
                  cluster.emergencyState === 'recovery'
                    ? isDark
                      ? recoveryGreenDark
                      : recoveryGreenLight
                    : headerDotColor,
              }}
            />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: headerDotColor }} />
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: cluster.emergencyState === 'emergency'
                ? isDark
                  ? '#fecaca'
                  : '#b91c1c'
                : cluster.emergencyState === 'recovery'
                  ? isDark
                    ? '#bbf7d0'
                    : '#166534'
                  : isDark
                    ? '#94a3b8'
                    : '#475569',
            }}
          >
            {terminalTitle}
          </span>
        </div>

        <div className="relative overflow-hidden" style={{ height: 'calc(100% - 33px)' }}>
          <div
            ref={scrollContainerRef}
            className="px-3 font-mono text-[0.7rem]"
            style={{ willChange: 'transform' }}
          >
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} style={{ lineHeight: '18px' }}>
                {formattedLogs.map((entry) => (
                  <div
                    key={`${copyIndex}-${entry.id}`}
                    className="whitespace-nowrap"
                    style={{
                      color: entry.color,
                      textShadow:
                        isFocused && isDark && cluster.emergencyState !== 'normal'
                          ? `0 0 4px ${
                              cluster.emergencyState === 'emergency'
                                ? emergencyRedDark
                                : recoveryGreenDark
                            }`
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
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-12"
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
