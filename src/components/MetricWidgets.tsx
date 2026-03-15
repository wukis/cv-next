'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DEFAULT_CLUSTER_SNAPSHOT,
  NETWORK_CLUSTER_STATE_EVENT,
  type ClusterSnapshot,
  type EmergencyState,
} from '@/lib/ambientCluster'

const darkModeColors = [
  '#00ffff',
  '#ff00ff',
  '#00ff99',
  '#ffff00',
  '#ff6699',
  '#00aaff',
  '#80ff00',
  '#ff9900',
]

const lightModeColors = [
  '#008c99',
  '#9b147f',
  '#009966',
  '#9d8200',
  '#c2185b',
  '#0066cc',
  '#669900',
  '#c26200',
]

type WidgetType = 'sparkline' | 'bars' | 'gauge' | 'counter' | 'status'
type WidgetId =
  | 'req_rate'
  | 'lb'
  | 'queue'
  | 'pods'
  | 'latency'
  | 'cpu'
  | 'memory'
  | 'k8s'
  | 'uptime'
  | 'errors'
  | 'postgres'
  | 'redis'
  | 'traffic'
  | 'targets'

interface WidgetConfig {
  id: WidgetId
  type: WidgetType
  label: string
  colorIndex: number
  delay?: number
}

interface MetricWidgetProps extends WidgetConfig {
  isFocused: boolean
  cluster: ClusterSnapshot
  isDark: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function Sparkline({
  data,
  color,
  width = 112,
  height = 34,
  isFocused = false,
  isDark = true,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
  isFocused?: boolean
  isDark?: boolean
}) {
  const normalizedData = data.length > 1 ? data : [0, 0]
  const points = normalizedData
    .map((value, index) => {
      const x = (index / (normalizedData.length - 1)) * width
      const y = height - (value / 100) * height
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `${points} ${width},${height} 0,${height}`

  const opacity = isFocused ? (isDark ? 0.85 : 1) : isDark ? 0.35 : 0.4
  const glowSize = isFocused ? (isDark ? 4 : 2) : 0
  const strokeWidth = isDark ? 1.5 : 2

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ opacity, transition: 'opacity 0.5s ease' }}
    >
      <polygon
        fill={color}
        opacity={isDark ? 0.14 : 0.11}
        stroke="none"
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        points={points}
        style={{
          filter: glowSize > 0 ? `drop-shadow(0 0 ${glowSize}px ${color})` : 'none',
          transition: 'filter 0.5s ease',
        }}
      />
    </svg>
  )
}

function MiniBarChart({
  values,
  color,
  width = 112,
  height = 42,
  isFocused = false,
  isDark = true,
}: {
  values: number[]
  color: string
  width?: number
  height?: number
  isFocused?: boolean
  isDark?: boolean
}) {
  const gap = 5
  const barWidth = (width - gap * (values.length - 1)) / values.length
  const baseOpacity = isFocused ? (isDark ? 0.85 : 1) : isDark ? 0.35 : 0.4
  const glowSize = isFocused ? (isDark ? 4 : 2) : 0

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ opacity: baseOpacity, transition: 'opacity 0.5s ease' }}
    >
      {values.map((value, index) => {
        const barHeight = (value / 100) * height
        const x = index * (barWidth + gap)
        const y = height - barHeight
        return (
          <g key={index}>
            <rect
              x={x}
              y={0}
              width={barWidth}
              height={height}
              rx={barWidth * 0.3}
              fill={isDark ? 'rgba(31, 41, 55, 0.48)' : 'rgba(203, 213, 225, 0.62)'}
            />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth * 0.3}
              fill={color}
              opacity={0.72 + (value / 100) * 0.28}
              style={{
                filter: glowSize > 0 ? `drop-shadow(0 0 ${glowSize}px ${color})` : 'none',
                transition: 'filter 0.5s ease',
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}

function CircularGauge({
  value,
  color,
  size = 32,
  isFocused = false,
  isDark = true,
}: {
  value: number
  color: string
  size?: number
  isFocused?: boolean
  isDark?: boolean
}) {
  const strokeWidth = isDark ? 3 : 3.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const opacity = isFocused ? (isDark ? 0.85 : 1) : isDark ? 0.35 : 0.4
  const glowSize = isFocused ? (isDark ? 5 : 2) : 0

  return (
    <svg width={size} height={size} className="-rotate-90" style={{ opacity, transition: 'opacity 0.5s ease' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={isDark ? 0.2 : 0.3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          filter: glowSize > 0 ? `drop-shadow(0 0 ${glowSize}px ${color})` : 'none',
          transition: 'filter 0.5s ease',
        }}
      />
    </svg>
  )
}

function getTargetValue(widgetId: WidgetId, cluster: ClusterSnapshot) {
  switch (widgetId) {
    case 'req_rate':
      return clamp(
        cluster.requestRate / 24 +
          (cluster.emergencyState === 'emergency' ? 8 : 0),
        16,
        98,
      )
    case 'latency':
      return clamp(
        cluster.latencyMs * 1.35 +
          (cluster.emergencyState === 'emergency' ? 18 : 0),
        12,
        99,
      )
    case 'errors':
      return clamp(
        cluster.errorRate * 9 +
          cluster.unhealthyReplicas * 8 +
          cluster.drainingReplicas * 5 +
          (cluster.emergencyState === 'emergency' ? 34 : 0) +
          (cluster.emergencyState === 'recovery' ? 8 : 0),
        3,
        100,
      )
    case 'cpu':
      return clamp(
        36 +
          cluster.trafficIntensity * 26 +
          cluster.drainingReplicas * 5 +
          cluster.unhealthyReplicas * 7 +
          (cluster.emergencyState === 'emergency' ? 10 : 0),
        20,
        96,
      )
    case 'memory':
      return clamp(
        48 +
          cluster.startingReplicas * 8 +
          cluster.unhealthyReplicas * 4 +
          cluster.trafficIntensity * 16 +
          (cluster.emergencyState === 'emergency' ? 6 : 0),
        35,
        94,
      )
    case 'uptime':
      return clamp(
        99.9 -
          cluster.errorRate * 0.08 -
          cluster.unhealthyReplicas * 0.12 -
          cluster.drainingReplicas * 0.04,
        98.6,
        99.99,
      )
    default:
      return clamp(cluster.trafficIntensity * 100, 10, 90)
  }
}

function getBarValues(widgetId: WidgetId, cluster: ClusterSnapshot) {
  if (widgetId !== 'queue') {
    return Array.from({ length: 6 }, () => 40)
  }

  const incidentBoost =
    cluster.emergencyState === 'emergency'
      ? 24
      : cluster.emergencyState === 'recovery'
        ? 8
        : 0
  const base = clamp(cluster.queueDepth * 1.45 + incidentBoost, 12, 96)
  return Array.from({ length: 6 }, (_, index) =>
    clamp(
      base +
        Math.sin(Date.now() / 350 + index * 0.75) * 10 +
        index * 4 +
        (cluster.emergencyState === 'emergency' ? index * 2.5 : 0),
      8,
      100,
    ),
  )
}

function getStatusDisplay(widgetId: WidgetId, cluster: ClusterSnapshot) {
  if (cluster.emergencyState === 'emergency') {
    return { text: 'ALERT', tone: 'critical' as const }
  }

  if (cluster.emergencyState === 'recovery') {
    return { text: 'HEAL', tone: 'healthy' as const }
  }

  switch (widgetId) {
    case 'lb':
      if (cluster.readyReplicas < Math.max(2, cluster.replicaTarget - 1)) {
        return { text: 'REROUTE', tone: 'degraded' as const }
      }
      return { text: 'OK', tone: 'healthy' as const }
    case 'k8s':
      if (cluster.startingReplicas > 0 || cluster.drainingReplicas > 0) {
        return { text: 'SELFHL', tone: 'degraded' as const }
      }
      return { text: 'READY', tone: 'healthy' as const }
    case 'postgres':
      if (cluster.errorRate > 6) {
        return { text: 'LAG', tone: 'degraded' as const }
      }
      return { text: 'SYNC', tone: 'healthy' as const }
    case 'redis':
      if (cluster.queueDepth > 40) {
        return { text: 'HOT', tone: 'degraded' as const }
      }
      return { text: 'HIT', tone: 'healthy' as const }
    default:
      return { text: 'OK', tone: 'healthy' as const }
  }
}

function getCounterDisplay(widgetId: WidgetId, cluster: ClusterSnapshot, emergencyState: EmergencyState) {
  switch (widgetId) {
    case 'pods':
      return `${cluster.readyReplicas}/${cluster.replicaTarget}`
    case 'traffic':
      return `${(cluster.requestRate / 1000).toFixed(1)}k`
    case 'targets':
      return emergencyState === 'emergency'
        ? `${cluster.loadBalancerTargets.length} live`
        : String(cluster.loadBalancerTargets.length)
    default:
      return emergencyState === 'emergency' ? '!ERR' : `${cluster.liveReplicas}`
  }
}

function getShouldRenderMetricWidgets() {
  if (typeof window === 'undefined') {
    return false
  }

  const width = window.innerWidth
  const height = window.innerHeight
  return width > 1200 && width / height > 1.4
}

function MetricWidget({
  id,
  type,
  label,
  colorIndex,
  delay = 0,
  isFocused = false,
  cluster,
  isDark = true,
}: MetricWidgetProps) {
  const [data, setData] = useState<number[]>(() => Array.from({ length: 20 }, () => 40))
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 6 }, () => 28))
  const [value, setValue] = useState(() => getTargetValue(id, cluster))
  const [visible, setVisible] = useState(false)
  const clusterRef = useRef(cluster)

  useEffect(() => {
    clusterRef.current = cluster
  }, [cluster])

  useEffect(() => {
    const appearTimeout = setTimeout(() => setVisible(true), delay)
    const interval = setInterval(() => {
      const snapshot = clusterRef.current
      const targetValue = getTargetValue(id, snapshot)

      if (type === 'sparkline') {
        setData((previous) => {
          const next = [...previous.slice(1)]
          const current = previous[previous.length - 1]
          const drift = (targetValue - current) * 0.32 + (Math.random() - 0.5) * 5
          next.push(clamp(current + drift, 4, 98))
          return next
        })
      }

      if (type === 'bars') {
        setBars(getBarValues(id, snapshot))
      }

      if (type === 'gauge') {
        setValue((previous) => previous + (targetValue - previous) * 0.28)
      }
    }, 1200)

    return () => {
      clearTimeout(appearTimeout)
      clearInterval(interval)
    }
  }, [delay, id, type])

  const emergencyState = cluster.emergencyState
  const baseColor = isDark ? darkModeColors[colorIndex] : lightModeColors[colorIndex]
  const emergencyRed = isDark ? '#ff3333' : '#cc0000'
  const recoveryGreen = isDark ? '#33ff66' : '#009933'
  const effectiveColor =
    emergencyState === 'emergency'
      ? emergencyRed
      : emergencyState === 'recovery'
        ? recoveryGreen
        : baseColor

  const statusHealthyColor = isDark ? '#00ff88' : '#009955'
  const statusDegradedColor = isDark ? '#ffaa00' : '#cc7700'
  const statusCriticalColor = isDark ? '#ff5555' : '#c62828'
  const isActive = isFocused
  const containerOpacity = isActive ? 1 : isDark ? 0.32 : 0.44
  const textOpacity = isActive ? (isDark ? 0.72 : 0.9) : isDark ? 0.3 : 0.42
  const borderColor =
    emergencyState === 'emergency'
      ? isDark
        ? 'border-red-500/50'
        : 'border-red-600/60'
      : emergencyState === 'recovery'
        ? isDark
          ? 'border-green-500/50'
          : 'border-green-600/60'
        : isDark
          ? 'border-neutral-700/20'
          : 'border-neutral-400/40'
  const bgColor =
    emergencyState === 'emergency'
      ? isDark
        ? 'bg-red-950/40'
        : 'bg-red-100/60'
      : emergencyState === 'recovery'
        ? isDark
          ? 'bg-green-950/40'
          : 'bg-green-100/60'
        : isDark
          ? 'bg-neutral-900/30'
          : 'bg-white/55'

  const statusDisplay = getStatusDisplay(id, cluster)
  const statusColor =
    statusDisplay.tone === 'healthy'
      ? statusHealthyColor
      : statusDisplay.tone === 'degraded'
        ? statusDegradedColor
        : statusCriticalColor
  const counterText = getCounterDisplay(id, cluster, emergencyState)
  const uptimeDisplay = `${value.toFixed(2)}%`

  return (
    <div
      className={`
        flex w-[128px] flex-col gap-1.5 rounded-xl border px-3 py-2.5
        backdrop-blur-sm transition-all duration-300 ease-out
        ${visible ? 'translate-y-0' : 'translate-y-2 opacity-0'}
        ${borderColor} ${bgColor}
        ${emergencyState === 'emergency' ? 'animate-pulse' : ''}
      `}
      style={{
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(148, 163, 184, 0.08)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        opacity: visible ? containerOpacity : 0,
        transition:
          'opacity 0.3s ease, transform 0.5s ease, background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <span
        className={`truncate font-mono text-[9px] uppercase tracking-wider transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
        style={{
          opacity: textOpacity,
          color:
            emergencyState === 'emergency'
              ? emergencyRed
              : emergencyState === 'recovery'
                ? recoveryGreen
                : undefined,
        }}
      >
        {label}
      </span>

      {type === 'sparkline' ? (
        <div className="w-full">
          <Sparkline data={data} color={effectiveColor} width={112} height={34} isFocused={isActive} isDark={isDark} />
        </div>
      ) : null}

      {type === 'bars' ? (
        <div className="w-full">
          <MiniBarChart values={bars} color={effectiveColor} width={112} height={42} isFocused={isActive} isDark={isDark} />
        </div>
      ) : null}

      {type === 'gauge' ? (
        <div className="flex items-center justify-between gap-2">
          <CircularGauge
            value={id === 'uptime' ? clamp(value, 0, 100) : clamp(value, 0, 100)}
            color={effectiveColor}
            size={30}
            isFocused={isActive}
            isDark={isDark}
          />
          <span
            className="font-mono text-[10px] transition-all duration-300"
            style={{
              color: effectiveColor,
              opacity: isActive ? 1 : isDark ? 0.34 : 0.48,
              textShadow: isActive && isDark ? `0 0 6px ${effectiveColor}` : 'none',
              fontWeight: isDark ? 500 : 600,
            }}
          >
            {id === 'uptime' ? uptimeDisplay : `${Math.round(value)}%`}
          </span>
        </div>
      ) : null}

      {type === 'counter' ? (
        <span
          className="text-sm font-mono font-medium transition-all duration-300"
          style={{
            color: effectiveColor,
            opacity: isActive ? 1 : isDark ? 0.34 : 0.48,
            textShadow: isActive && isDark ? `0 0 6px ${effectiveColor}` : 'none',
          }}
        >
          {counterText}
        </span>
      ) : null}

      {type === 'status' ? (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full transition-all duration-300 ${isActive || statusDisplay.tone !== 'healthy' ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: statusColor,
              boxShadow: isActive ? `0 0 ${isDark ? 8 : 4}px ${statusColor}` : 'none',
              opacity: isActive ? 1 : isDark ? 0.35 : 0.5,
            }}
          />
          <span
            className={`font-mono text-[10px] transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
            style={{
              opacity: isActive ? 0.82 : isDark ? 0.3 : 0.42,
              color: statusColor,
              fontWeight: isDark ? 'normal' : 500,
            }}
          >
            {statusDisplay.text}
          </span>
        </div>
      ) : null}
    </div>
  )
}

const leftWidgets: WidgetConfig[] = [
  { id: 'req_rate', type: 'sparkline', label: 'req/sec', colorIndex: 0 },
  { id: 'lb', type: 'status', label: 'lb', colorIndex: 2 },
  { id: 'queue', type: 'bars', label: 'queue', colorIndex: 7 },
  { id: 'pods', type: 'counter', label: 'pods', colorIndex: 2 },
  { id: 'latency', type: 'sparkline', label: 'latency', colorIndex: 4 },
  { id: 'cpu', type: 'gauge', label: 'cpu', colorIndex: 5 },
  { id: 'memory', type: 'gauge', label: 'memory', colorIndex: 6 },
]

const rightWidgets: WidgetConfig[] = [
  { id: 'uptime', type: 'gauge', label: 'uptime', colorIndex: 2 },
  { id: 'errors', type: 'sparkline', label: 'errors', colorIndex: 4 },
  { id: 'postgres', type: 'status', label: 'postgres', colorIndex: 2 },
  { id: 'redis', type: 'status', label: 'redis', colorIndex: 0 },
  { id: 'traffic', type: 'counter', label: 'traffic', colorIndex: 0 },
  { id: 'targets', type: 'counter', label: 'targets', colorIndex: 5 },
  { id: 'k8s', type: 'status', label: 'k8s', colorIndex: 2 },
]

export default function MetricWidgets() {
  const [shouldRender, setShouldRender] = useState(getShouldRenderMetricWidgets)
  const [isFocused, setIsFocused] = useState(false)
  const [cluster, setCluster] = useState<ClusterSnapshot>(DEFAULT_CLUSTER_SNAPSHOT)
  const [isDark, setIsDark] = useState(true)

  const checkScreenSize = useCallback(() => {
    setShouldRender(getShouldRenderMetricWidgets())
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
    const handleClusterUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClusterSnapshot>
      if (customEvent.detail) {
        setCluster(customEvent.detail)
      }
    }

    window.addEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
    return () => window.removeEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-5 top-1/2 flex max-h-[80vh] -translate-y-1/2 flex-col gap-2.5 overflow-hidden">
        {leftWidgets.map((widget, index) => (
          <MetricWidget
            key={`left-${widget.id}`}
            {...widget}
            delay={index * 150}
            isFocused={isFocused}
            cluster={cluster}
            isDark={isDark}
          />
        ))}
      </div>

      <div className="absolute right-5 top-1/2 flex max-h-[80vh] -translate-y-1/2 flex-col gap-2.5 overflow-hidden">
        {rightWidgets.map((widget, index) => (
          <MetricWidget
            key={`right-${widget.id}`}
            {...widget}
            delay={index * 150 + 100}
            isFocused={isFocused}
            cluster={cluster}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  )
}
