'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { type ClusterSnapshot } from '@/lib/ambientCluster'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'
import {
  type AmbientSemanticMode,
  deriveAmbientMonitoringState,
} from '@/lib/ambientMonitoring'

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
type CompositeWidgetId = 'traffic_flow' | 'capacity'

interface WidgetConfig {
  id: WidgetId
  type: WidgetType
  label: string
  colorIndex: number
  delay?: number
}

interface SingleWidgetConfig extends WidgetConfig {
  kind: 'single'
}

interface CompositeWidgetConfig {
  kind: 'composite'
  id: CompositeWidgetId
  label: string
  colorIndex: number
  delay?: number
}

type MetricLayoutItem = SingleWidgetConfig | CompositeWidgetConfig
type MetricLayoutGroup = {
  direction?: 'row' | 'column'
  items: MetricLayoutItem[]
}

interface MetricWidgetProps extends SingleWidgetConfig {
  isFocused: boolean
  cluster: ClusterSnapshot
  isDark: boolean
  mode: AmbientSemanticMode
}

interface CompositeMetricWidgetProps extends CompositeWidgetConfig {
  isFocused: boolean
  cluster: ClusterSnapshot
  isDark: boolean
  mode: AmbientSemanticMode
}

type StatusTone = 'healthy' | 'preview' | 'surge' | 'degraded' | 'critical'
type WidgetVisualState = 'normal' | 'error' | 'recovered'
type WidgetMeta = {
  lead: string
  detail: string
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function Sparkline({
  data,
  color,
  width = 102,
  height = 30,
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
          filter:
            glowSize > 0 ? `drop-shadow(0 0 ${glowSize}px ${color})` : 'none',
          transition: 'filter 0.5s ease',
        }}
      />
    </svg>
  )
}

function MiniBarChart({
  values,
  color,
  width = 102,
  height = 36,
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
              fill={
                isDark ? 'rgba(31, 41, 55, 0.48)' : 'rgba(203, 213, 225, 0.62)'
              }
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
                filter:
                  glowSize > 0
                    ? `drop-shadow(0 0 ${glowSize}px ${color})`
                    : 'none',
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
  size = 28,
  isFocused = false,
  isDark = true,
  label,
  labelFontSize,
}: {
  value: number
  color: string
  size?: number
  isFocused?: boolean
  isDark?: boolean
  label?: string
  labelFontSize?: number
}) {
  const strokeWidth = isDark ? 3 : 3.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const opacity = isFocused ? (isDark ? 0.85 : 1) : isDark ? 0.35 : 0.4
  const glowSize = isFocused ? (isDark ? 5 : 2) : 0
  const padding = Math.max(glowSize + strokeWidth, 4)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-padding} ${-padding} ${size + padding * 2} ${size + padding * 2}`}
      style={{
        opacity,
        overflow: 'visible',
        transition: 'opacity 0.5s ease',
      }}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
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
            filter:
              glowSize > 0 ? `drop-shadow(0 0 ${glowSize}px ${color})` : 'none',
            transition: 'filter 0.5s ease',
          }}
        />
      </g>
      {label ? (
        <>
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={labelFontSize ?? size * 0.34}
            fontFamily="ui-monospace, monospace"
            fontWeight={700}
            letterSpacing="-0.03em"
            fill={color}
            style={{
              opacity: isFocused ? 0.98 : isDark ? 0.82 : 0.9,
              filter:
                isFocused && isDark ? `drop-shadow(0 0 4px ${color})` : 'none',
            }}
          >
            {label}
          </text>
        </>
      ) : null}
    </svg>
  )
}

function getWidgetAppearance(
  cluster: ClusterSnapshot,
  isDark: boolean,
  isPreviewing: boolean,
  baseColor: string,
  normalColorOverride?: string,
) {
  const visualState = getWidgetVisualState(cluster)
  const emergencyRed = isDark ? '#ff3333' : '#cc0000'
  const recoveryGreen = isDark ? '#33ff66' : '#009933'
  const effectiveColor =
    visualState === 'error'
      ? emergencyRed
      : visualState === 'recovered'
        ? recoveryGreen
        : (normalColorOverride ?? baseColor)

  const containerOpacity = isPreviewing ? 1 : isDark ? 0.16 : 0.24

  const textOpacity = isPreviewing
    ? isDark
      ? 0.82
      : 0.94
    : isDark
      ? 0.24
      : 0.4

  const borderColor =
    visualState === 'error'
      ? isDark
        ? 'border-red-500/50'
        : 'border-red-600/60'
      : visualState === 'recovered'
        ? isDark
          ? 'border-green-500/50'
          : 'border-green-600/60'
        : isDark
          ? 'border-neutral-700/20'
          : 'border-neutral-400/40'

  const bgColor =
    visualState === 'error'
      ? isDark
        ? 'bg-red-950/40'
        : 'bg-red-100/60'
      : visualState === 'recovered'
        ? isDark
          ? 'bg-green-950/40'
          : 'bg-green-100/60'
        : isDark
          ? 'bg-neutral-900/30'
          : 'bg-white/55'

  return {
    visualState,
    emergencyRed,
    recoveryGreen,
    effectiveColor,
    containerOpacity,
    textOpacity,
    borderColor,
    bgColor,
  }
}

function isScenario(
  cluster: ClusterSnapshot,
  scenarioKey: ClusterSnapshot['scenarioKey'],
) {
  return cluster.scenarioKey === scenarioKey
}

function getWidgetVisualState(cluster: ClusterSnapshot): WidgetVisualState {
  if (cluster.emergencyState === 'emergency') {
    return 'error'
  }

  if (cluster.emergencyState === 'recovery') {
    return 'recovered'
  }

  return 'normal'
}

function getTargetValue(
  widgetId: WidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
) {
  switch (widgetId) {
    case 'req_rate':
      return clamp(
        cluster.requestRate / 24 + (mode === 'preview' ? 4 : 0),
        16,
        98,
      )
    case 'latency':
      return clamp(
        cluster.latencyMs * 1.45 +
          (mode === 'preview' ? 6 : 0) +
          (mode === 'incident' ? 8 : 0),
        12,
        99,
      )
    case 'errors':
      return clamp(
        cluster.errorRate * 9 +
          cluster.unhealthyReplicas * 8 +
          cluster.drainingReplicas * 5 +
          (mode === 'preview' ? 2 : 0),
        3,
        100,
      )
    case 'cpu':
      return clamp(
        36 +
          cluster.trafficIntensity * 26 +
          cluster.drainingReplicas * 5 +
          cluster.unhealthyReplicas * 7 +
          (mode === 'preview' ? 4 : 0),
        20,
        96,
      )
    case 'memory':
      return clamp(
        48 +
          cluster.startingReplicas * 8 +
          cluster.unhealthyReplicas * 4 +
          cluster.trafficIntensity * 16 +
          (mode === 'preview' ? 4 : 0),
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

function getBarValues(
  widgetId: WidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
) {
  if (widgetId !== 'queue') {
    return Array.from({ length: 6 }, () => 40)
  }

  const incidentBoost =
    mode === 'incident'
      ? 18
      : mode === 'recovery'
        ? 8
        : mode === 'surge'
          ? 6
          : mode === 'preview'
            ? 4
            : 0
  const base = clamp(cluster.queueDepth * 1.45 + incidentBoost, 12, 96)
  return Array.from({ length: 6 }, (_, index) =>
    clamp(
      base +
        Math.sin(Date.now() / 350 + index * 0.75) * 10 +
        index * 4 +
        (mode === 'incident' ? index * 2.5 : 0) +
        (mode === 'surge' ? index * 1.5 : 0),
      8,
      100,
    ),
  )
}

function getStatusDisplay(
  widgetId: WidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
) {
  switch (widgetId) {
    case 'lb':
      if (mode === 'incident' && isScenario(cluster, 'failover')) {
        return { text: 'REROUTE', tone: 'critical' as const }
      }
      if (mode === 'recovery' && isScenario(cluster, 'failover')) {
        return { text: 'REJOIN', tone: 'healthy' as const }
      }
      if (
        !cluster.loadBalancerHealthy ||
        cluster.readyReplicas < Math.max(2, cluster.replicaTarget - 1)
      ) {
        return {
          text: mode === 'preview' ? 'WATCH' : 'SHIFT',
          tone:
            mode === 'preview' ? ('preview' as const) : ('degraded' as const),
        }
      }
      if (mode === 'preview') {
        return { text: 'WATCH', tone: 'preview' as const }
      }
      if (mode === 'surge') {
        return { text: 'SURGE', tone: 'surge' as const }
      }
      return { text: 'ROUTE', tone: 'healthy' as const }
    case 'k8s':
      if (mode === 'incident') {
        return {
          text: isScenario(cluster, 'queueFull') ? 'BACKPR' : 'ROLL',
          tone: 'critical' as const,
        }
      }
      if (mode === 'recovery') {
        return { text: 'RECON', tone: 'healthy' as const }
      }
      if (cluster.startingReplicas > 0 || cluster.drainingReplicas > 0) {
        return {
          text: mode === 'surge' ? 'SCALE' : 'RECON',
          tone: mode === 'surge' ? ('surge' as const) : ('degraded' as const),
        }
      }
      if (mode === 'preview') {
        return { text: 'SCAN', tone: 'preview' as const }
      }
      return { text: 'READY', tone: 'healthy' as const }
    case 'postgres':
      if (mode === 'incident' && isScenario(cluster, 'dbDown')) {
        return { text: 'RETRY', tone: 'critical' as const }
      }
      if (mode === 'recovery' && isScenario(cluster, 'dbDown')) {
        return { text: 'RESYNC', tone: 'healthy' as const }
      }
      if (mode === 'preview') {
        return { text: 'GUARD', tone: 'preview' as const }
      }
      if (cluster.errorRate > 6 || cluster.latencyMs > 70) {
        return {
          text: 'LAG',
          tone: mode === 'surge' ? ('surge' as const) : ('degraded' as const),
        }
      }
      if (mode === 'surge') {
        return { text: 'SYNC+', tone: 'surge' as const }
      }
      return { text: 'SYNC', tone: 'healthy' as const }
    case 'redis':
      if (mode === 'incident' && isScenario(cluster, 'cacheReload')) {
        return { text: 'WARM', tone: 'degraded' as const }
      }
      if (mode === 'recovery' && isScenario(cluster, 'cacheReload')) {
        return { text: 'REHIT', tone: 'healthy' as const }
      }
      if (mode === 'preview') {
        return { text: 'MISS?', tone: 'preview' as const }
      }
      if (cluster.queueDepth > 40 || cluster.latencyMs > 60) {
        return {
          text: 'HOT',
          tone: mode === 'surge' ? ('surge' as const) : ('degraded' as const),
        }
      }
      if (mode === 'surge') {
        return { text: 'PRIME', tone: 'surge' as const }
      }
      return { text: 'HIT', tone: 'healthy' as const }
    default:
      return { text: 'OK', tone: 'healthy' as const }
  }
}

function getCounterDisplay(
  widgetId: WidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
) {
  switch (widgetId) {
    case 'pods':
      return `${cluster.readyReplicas}/${cluster.replicaTarget}`
    case 'traffic':
      return `${(cluster.requestRate / 1000).toFixed(1)}k`
    case 'targets':
      return mode === 'incident'
        ? `${cluster.loadBalancerTargets.length} live`
        : mode === 'recovery'
          ? `${cluster.loadBalancerTargets.length} heal`
          : mode === 'preview'
            ? `${cluster.loadBalancerTargets.length} watch`
            : String(cluster.loadBalancerTargets.length)
    default:
      return mode === 'incident' ? '!ERR' : `${cluster.liveReplicas}`
  }
}

function getWidgetMeta(
  widgetId: WidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
): WidgetMeta {
  switch (widgetId) {
    case 'req_rate':
      return {
        lead:
          mode === 'preview'
            ? 'traffic paths opening'
            : cluster.requestRate > 2600
              ? 'edge burst active'
              : 'steady ingress',
        detail: `${Math.round(cluster.requestRate)} req/min sample`,
      }
    case 'latency':
      return {
        lead:
          cluster.latencyMs > 65
            ? 'tail latency climbing'
            : mode === 'recovery'
              ? 'latency settling'
              : 'mesh latency stable',
        detail: `p95 ${Math.round(cluster.latencyMs)}ms`,
      }
    case 'errors':
      return {
        lead:
          cluster.errorRate > 4
            ? 'error budget burning'
            : mode === 'recovery'
              ? 'error rate cooling'
              : 'healthy request mix',
        detail: `${cluster.errorRate.toFixed(1)}% app failures`,
      }
    case 'queue':
      return {
        lead:
          cluster.queueDepth > 40
            ? 'backlog under pressure'
            : mode === 'surge'
              ? 'workers pre-scaling'
              : 'queue draining cleanly',
        detail: `${cluster.queueDepth} jobs buffered`,
      }
    case 'cpu':
      return {
        lead:
          cluster.trafficIntensity > 0.72
            ? 'cpu pressure rising'
            : 'compute headroom ok',
        detail: `${Math.round(36 + cluster.trafficIntensity * 26)}% active load`,
      }
    case 'memory':
      return {
        lead:
          cluster.startingReplicas > 0
            ? 'warm pods reserving'
            : 'memory envelope calm',
        detail: `${cluster.startingReplicas} pods warming`,
      }
    case 'uptime':
      return {
        lead:
          mode === 'recovery' ? 'availability healing' : 'availability target',
        detail: `${cluster.readyReplicas}/${cluster.replicaTarget} ready`,
      }
    case 'traffic':
      return {
        lead:
          mode === 'preview'
            ? 'hover preview uplift'
            : mode === 'surge'
              ? 'surge routing active'
              : 'public edge traffic',
        detail: `${(cluster.trafficIntensity * 100).toFixed(0)}% traffic intensity`,
      }
    case 'targets':
      return {
        lead:
          cluster.loadBalancerTargets.length <
          Math.max(2, cluster.replicaTarget - 1)
            ? 'target pool narrowed'
            : 'target pool healthy',
        detail: `${cluster.loadBalancerTargets.join(', ') || 'none ready'}`,
      }
    case 'pods':
      return {
        lead:
          cluster.startingReplicas > 0 || cluster.drainingReplicas > 0
            ? 'replica set moving'
            : 'replicas in balance',
        detail: `${cluster.liveReplicas} live / ${cluster.readyReplicas} serving`,
      }
    case 'lb':
      return {
        lead:
          mode === 'incident' && isScenario(cluster, 'failover')
            ? 'rerouting hot traffic'
            : 'edge routes stable',
        detail: `${cluster.loadBalancerTargets.length} active targets`,
      }
    case 'postgres':
      return {
        lead:
          mode === 'incident' && isScenario(cluster, 'dbDown')
            ? 'writes backing off'
            : 'primary replica in sync',
        detail:
          cluster.errorRate > 6
            ? 'replication lag visible'
            : 'commit path healthy',
      }
    case 'redis':
      return {
        lead:
          mode === 'incident' && isScenario(cluster, 'cacheReload')
            ? 'cache warming keys'
            : 'hit ratio holding',
        detail:
          cluster.queueDepth > 40
            ? 'miss pressure elevated'
            : 'misses within budget',
      }
    case 'k8s':
      return {
        lead:
          cluster.startingReplicas > 0 || cluster.drainingReplicas > 0
            ? 'controllers reconciling'
            : 'cluster control ready',
        detail: `${cluster.startingReplicas} starting / ${cluster.drainingReplicas} draining`,
      }
    default:
      return {
        lead: 'cluster telemetry',
        detail: 'ambient signal online',
      }
  }
}

function getCompositeWidgetMeta(
  widgetId: CompositeWidgetId,
  cluster: ClusterSnapshot,
  mode: AmbientSemanticMode,
): WidgetMeta {
  switch (widgetId) {
    case 'traffic_flow':
      return {
        lead:
          cluster.latencyMs > 65
            ? 'ingress flow under pressure'
            : mode === 'preview'
              ? 'edge flow paths opening'
              : 'edge flow steady',
        detail: `${getWidgetMeta('traffic', cluster, mode).detail} | ${getWidgetMeta('latency', cluster, mode).detail}`,
      }
    case 'capacity':
      return {
        lead:
          cluster.startingReplicas > 0 || cluster.drainingReplicas > 0
            ? 'runtime capacity shifting'
            : 'runtime capacity balanced',
        detail: `${getWidgetMeta('pods', cluster, mode).detail} | ${getWidgetMeta('memory', cluster, mode).detail}`,
      }
  }
}

function getShouldRenderMetricWidgets() {
  if (typeof window === 'undefined') {
    return false
  }

  const width = window.innerWidth
  const height = window.innerHeight
  return width >= 1280 && width / height >= 1.6
}

function getGroupDelay(
  groups: MetricLayoutGroup[],
  groupIndex: number,
  itemIndex: number,
  offset = 0,
) {
  const priorItems = groups
    .slice(0, groupIndex)
    .reduce((sum, group) => sum + group.items.length, 0)

  return (priorItems + itemIndex) * 130 + offset
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
  mode,
}: MetricWidgetProps) {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => 40),
  )
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: 6 }, () => 28),
  )
  const [value, setValue] = useState(() => getTargetValue(id, cluster, mode))
  const [visible, setVisible] = useState(false)
  const stateRef = useRef({ cluster, mode })

  useEffect(() => {
    stateRef.current = { cluster, mode }
  }, [cluster, mode])

  useEffect(() => {
    const appearTimeout = setTimeout(() => setVisible(true), delay)
    const interval = setInterval(() => {
      const { cluster: snapshot, mode: currentMode } = stateRef.current
      const targetValue = getTargetValue(id, snapshot, currentMode)

      if (type === 'sparkline') {
        setData((previous) => {
          const next = [...previous.slice(1)]
          const current = previous[previous.length - 1]
          const drift =
            (targetValue - current) * 0.32 + (Math.random() - 0.5) * 5
          next.push(clamp(current + drift, 4, 98))
          return next
        })
      }

      if (type === 'bars') {
        setBars(getBarValues(id, snapshot, currentMode))
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

  const baseColor = isDark
    ? darkModeColors[colorIndex]
    : lightModeColors[colorIndex]
  const gaugeNormalColor =
    type === 'gauge' && id === 'cpu'
      ? isDark
        ? '#38bdf8'
        : '#0369a1'
      : type === 'gauge' && id === 'memory'
        ? isDark
          ? '#f59e0b'
          : '#c2410c'
        : undefined
  const statusHealthyColor = isDark ? '#00ff88' : '#009955'
  const statusDegradedColor = isDark ? '#ffaa00' : '#cc7700'
  const statusCriticalColor = isDark ? '#ff5555' : '#c62828'
  const isPreviewing = isFocused
  const {
    visualState,
    emergencyRed,
    recoveryGreen,
    effectiveColor,
    containerOpacity,
    textOpacity,
    borderColor,
    bgColor,
  } = getWidgetAppearance(
    cluster,
    isDark,
    isPreviewing,
    baseColor,
    gaugeNormalColor,
  )

  const statusDisplay = getStatusDisplay(id, cluster, mode)
  const statusColor =
    statusDisplay.tone === 'healthy'
      ? statusHealthyColor
      : visualState === 'error'
        ? statusCriticalColor
        : visualState === 'recovered'
          ? statusHealthyColor
          : statusDisplay.tone === 'degraded'
            ? statusDegradedColor
            : statusCriticalColor
  const counterText = getCounterDisplay(id, cluster, mode)
  const uptimeDisplay = `${value.toFixed(2)}%`
  const widgetMeta = getWidgetMeta(id, cluster, mode)

  return (
    <div
      className={`flex w-[124px] flex-col gap-1.5 rounded-xl border px-2.5 py-2 backdrop-blur-sm transition-all duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-2 opacity-0'} ${borderColor} ${bgColor} ${isPreviewing && visualState === 'error' ? 'animate-pulse' : ''} `}
      style={{
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(148, 163, 184, 0.08)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        opacity: visible ? containerOpacity : 0,
        transition:
          'opacity 0.3s ease, transform 0.5s ease, background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="min-w-0">
        <span
          className={`block h-[10px] truncate font-mono text-[8px] uppercase tracking-wider transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
          style={{
            opacity: textOpacity,
            color:
              visualState === 'error'
                ? emergencyRed
                : visualState === 'recovered'
                  ? recoveryGreen
                  : undefined,
          }}
        >
          {label}
        </span>
        <span
          className={`block h-[10px] truncate whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.16em] ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}
          style={{
            opacity: isPreviewing ? 0.7 : 0.42,
            color: effectiveColor,
          }}
        >
          {widgetMeta.lead}
        </span>
      </div>

      {type === 'sparkline' ? (
        <div className="w-full">
          <Sparkline
            data={data}
            color={effectiveColor}
            width={102}
            height={30}
            isFocused={isPreviewing}
            isDark={isDark}
          />
        </div>
      ) : null}

      {type === 'bars' ? (
        <div className="w-full">
          <MiniBarChart
            values={bars}
            color={effectiveColor}
            width={102}
            height={36}
            isFocused={isPreviewing}
            isDark={isDark}
          />
        </div>
      ) : null}

      {type === 'gauge' ? (
        <div className="flex items-center justify-between gap-2">
          <CircularGauge
            value={
              id === 'uptime' ? clamp(value, 0, 100) : clamp(value, 0, 100)
            }
            color={effectiveColor}
            size={28}
            isFocused={isPreviewing}
            isDark={isDark}
            label={id === 'uptime' ? undefined : `${Math.round(value)}%`}
          />
          <span
            className="min-w-[52px] whitespace-nowrap text-right font-mono text-[9px] tabular-nums transition-all duration-300"
            style={{
              color: effectiveColor,
              opacity: isPreviewing ? 1 : isDark ? 0.34 : 0.48,
              textShadow:
                isPreviewing && isDark ? `0 0 6px ${effectiveColor}` : 'none',
              fontWeight: isDark ? 500 : 600,
            }}
          >
            {id === 'uptime' ? uptimeDisplay : `${Math.round(value)}%`}
          </span>
        </div>
      ) : null}

      {type === 'counter' ? (
        <span
          className="min-h-[16px] whitespace-nowrap font-mono text-[13px] font-medium tabular-nums transition-all duration-300"
          style={{
            color: effectiveColor,
            opacity: isPreviewing ? 1 : isDark ? 0.34 : 0.48,
            textShadow:
              isPreviewing && isDark ? `0 0 6px ${effectiveColor}` : 'none',
          }}
        >
          {counterText}
        </span>
      ) : null}

      {type === 'status' ? (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full transition-all duration-300 ${isPreviewing || statusDisplay.tone !== 'healthy' ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: statusColor,
              boxShadow: isPreviewing
                ? `0 0 ${isDark ? 8 : 4}px ${statusColor}`
                : 'none',
              opacity: isPreviewing ? 1 : isDark ? 0.35 : 0.5,
            }}
          />
          <span
            className={`min-w-[44px] whitespace-nowrap font-mono text-[9px] transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
            style={{
              opacity: isPreviewing ? 0.82 : isDark ? 0.3 : 0.42,
              color: statusColor,
              fontWeight: isDark ? 'normal' : 500,
            }}
          >
            {statusDisplay.text}
          </span>
        </div>
      ) : null}

      <div
        className={`leading-3.5 h-[29px] overflow-hidden border-t pt-1 font-mono text-[8px] ${isDark ? 'border-white/5 text-neutral-500' : 'border-black/5 text-neutral-500'}`}
        style={{
          opacity: isPreviewing ? 0.9 : isDark ? 0.42 : 0.56,
          color: visualState === 'normal' ? undefined : effectiveColor,
        }}
      >
        {widgetMeta.detail}
      </div>
    </div>
  )
}

function CompositeMetricWidget({
  id,
  label,
  colorIndex,
  delay = 0,
  isFocused = false,
  cluster,
  isDark = true,
  mode,
}: CompositeMetricWidgetProps) {
  const [visible, setVisible] = useState(false)
  const [reqData, setReqData] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => 40),
  )
  const [latencyData, setLatencyData] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => 36),
  )
  const [cpuValue, setCpuValue] = useState(() =>
    getTargetValue('cpu', cluster, mode),
  )
  const [memoryValue, setMemoryValue] = useState(() =>
    getTargetValue('memory', cluster, mode),
  )
  const stateRef = useRef({ cluster, mode })
  const requestPaceRef = useRef({
    previousRate: cluster.requestRate,
    phase: (cluster.requestRate % 360) * (Math.PI / 180),
    burst: 0,
  })

  useEffect(() => {
    stateRef.current = { cluster, mode }
  }, [cluster, mode])

  useEffect(() => {
    const appearTimeout = setTimeout(() => setVisible(true), delay)
    const interval = setInterval(() => {
      const { cluster: snapshot, mode: currentMode } = stateRef.current

      if (id === 'traffic_flow') {
        const requestPace = requestPaceRef.current
        const rateDelta = snapshot.requestRate - requestPace.previousRate
        requestPace.previousRate = snapshot.requestRate
        requestPace.phase += 0.45 + snapshot.trafficIntensity * 0.28
        requestPace.burst =
          requestPace.burst * 0.72 + Math.min(Math.abs(rateDelta) / 180, 18)

        const valleyWave =
          Math.sin(requestPace.phase) * 10 +
          Math.sin(requestPace.phase * 0.48 + 0.8) * 6
        const spikeWave =
          Math.max(0, Math.sin(requestPace.phase * 1.7 - 0.6)) *
          (7 + requestPace.burst)
        const requestTarget = clamp(
          snapshot.requestRate / 24 +
            valleyWave +
            spikeWave +
            rateDelta / 95 +
            snapshot.trafficIntensity * 8,
          8,
          98,
        )
        const latencyTarget = getTargetValue('latency', snapshot, currentMode)

        setReqData((previous) => {
          const next = [...previous.slice(1)]
          const current = previous[previous.length - 1]
          const drift =
            (requestTarget - current) * 0.46 +
            Math.sin(requestPace.phase * 1.3) * 2.4 +
            (Math.random() - 0.5) * (6 + requestPace.burst * 0.16)
          next.push(clamp(current + drift, 4, 98))
          return next
        })

        setLatencyData((previous) => {
          const next = [...previous.slice(1)]
          const current = previous[previous.length - 1]
          const drift =
            (latencyTarget - current) * 0.3 + (Math.random() - 0.5) * 3
          next.push(clamp(current + drift, 4, 98))
          return next
        })
      }

      if (id === 'capacity') {
        setCpuValue((previous) => {
          const target = getTargetValue('cpu', snapshot, currentMode)
          return previous + (target - previous) * 0.28
        })
        setMemoryValue((previous) => {
          const target = getTargetValue('memory', snapshot, currentMode)
          return previous + (target - previous) * 0.28
        })
      }
    }, 1200)

    return () => {
      clearTimeout(appearTimeout)
      clearInterval(interval)
    }
  }, [delay, id])

  const isPreviewing = isFocused
  const baseColor = isDark
    ? darkModeColors[colorIndex]
    : lightModeColors[colorIndex]
  const cpuNormalColor = isDark ? '#38bdf8' : '#0369a1'
  const memoryNormalColor = isDark ? '#f59e0b' : '#c2410c'
  const latencyNormalColor = isDark ? '#f472b6' : '#be185d'
  const {
    visualState,
    emergencyRed,
    recoveryGreen,
    effectiveColor,
    containerOpacity,
    textOpacity,
    borderColor,
    bgColor,
  } = getWidgetAppearance(cluster, isDark, isPreviewing, baseColor)
  const cpuGaugeColor =
    visualState === 'error'
      ? emergencyRed
      : visualState === 'recovered'
        ? recoveryGreen
        : cpuNormalColor
  const memoryGaugeColor =
    visualState === 'error'
      ? emergencyRed
      : visualState === 'recovered'
        ? recoveryGreen
        : memoryNormalColor
  const latencyTraceColor =
    visualState === 'error'
      ? emergencyRed
      : visualState === 'recovered'
        ? recoveryGreen
        : latencyNormalColor
  const compositeMeta = getCompositeWidgetMeta(id, cluster, mode)
  const trafficCounter = getCounterDisplay('traffic', cluster, mode)
  const podsCounter = getCounterDisplay('pods', cluster, mode)
  const podCounterFontSizePx =
    podsCounter.length >= 7 ? 14 : podsCounter.length >= 6 ? 15 : 18
  const k8sStatus = getStatusDisplay('k8s', cluster, mode)
  const statusHealthyColor = isDark ? '#00ff88' : '#009955'
  const statusDegradedColor = isDark ? '#ffaa00' : '#cc7700'
  const statusCriticalColor = isDark ? '#ff5555' : '#c62828'
  const k8sStatusColor =
    k8sStatus.tone === 'healthy'
      ? statusHealthyColor
      : visualState === 'error'
        ? statusCriticalColor
        : visualState === 'recovered'
          ? statusHealthyColor
          : k8sStatus.tone === 'degraded'
            ? statusDegradedColor
            : statusCriticalColor

  return (
    <div
      className={`flex w-[258px] flex-col gap-2 rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-all duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-2 opacity-0'} ${borderColor} ${bgColor} ${isPreviewing && visualState === 'error' ? 'animate-pulse' : ''} `}
      style={{
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(148, 163, 184, 0.08)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        opacity: visible ? containerOpacity : 0,
        transition:
          'opacity 0.3s ease, transform 0.5s ease, background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="min-w-0">
        <span
          className={`block h-[10px] truncate font-mono text-[8px] uppercase tracking-wider transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
          style={{
            opacity: textOpacity,
            color:
              visualState === 'error'
                ? emergencyRed
                : visualState === 'recovered'
                  ? recoveryGreen
                  : undefined,
          }}
        >
          {label}
        </span>
        <span
          className={`block h-[10px] truncate whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.16em] ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}
          style={{
            opacity: isPreviewing ? 0.7 : 0.42,
            color: effectiveColor,
          }}
        >
          {compositeMeta.lead}
        </span>
      </div>

      {id === 'traffic_flow' ? (
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between rounded-lg border border-white/5 bg-black/5 px-2.5 py-2">
            <span
              className="font-mono text-[7px] uppercase tracking-[0.16em]"
              style={{
                color: effectiveColor,
                opacity: isPreviewing ? 0.8 : 0.5,
              }}
            >
              ingress
            </span>
            <span
              className="font-mono text-[18px] font-semibold"
              style={{
                color: effectiveColor,
                opacity: isPreviewing ? 1 : isDark ? 0.42 : 0.56,
                textShadow:
                  isPreviewing && isDark ? `0 0 8px ${effectiveColor}` : 'none',
              }}
            >
              {trafficCounter}
            </span>
            <span
              className={`font-mono text-[8px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}
            >
              {getWidgetMeta('traffic', cluster, mode).detail}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="rounded-lg border border-white/5 bg-black/5 px-2 py-1.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[7px] uppercase tracking-[0.16em]"
                  style={{ color: effectiveColor, opacity: 0.78 }}
                >
                  request pace
                </span>
                <span
                  className="min-w-[52px] whitespace-nowrap text-right font-mono text-[8px] tabular-nums"
                  style={{ color: effectiveColor, opacity: 0.72 }}
                >
                  {Math.round(cluster.requestRate)}
                </span>
              </div>
              <Sparkline
                data={reqData}
                color={effectiveColor}
                width={148}
                height={24}
                isFocused={isPreviewing}
                isDark={isDark}
              />
            </div>
            <div className="rounded-lg border border-white/5 bg-black/5 px-2 py-1.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[7px] uppercase tracking-[0.16em]"
                  style={{ color: latencyTraceColor, opacity: 0.82 }}
                >
                  tail latency
                </span>
                <span
                  className="min-w-[52px] whitespace-nowrap text-right font-mono text-[8px] tabular-nums"
                  style={{ color: latencyTraceColor, opacity: 0.78 }}
                >
                  {Math.round(cluster.latencyMs)}ms
                </span>
              </div>
              <Sparkline
                data={latencyData}
                color={latencyTraceColor}
                width={148}
                height={24}
                isFocused={isPreviewing}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      ) : null}

      {id === 'capacity' ? (
        <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between rounded-lg border border-white/5 bg-black/5 px-2.5 py-2">
            <span
              className="font-mono text-[7px] uppercase tracking-[0.16em]"
              style={{
                color: effectiveColor,
                opacity: isPreviewing ? 0.8 : 0.5,
              }}
            >
              pod set
            </span>
            <span
              className="whitespace-nowrap font-mono font-semibold tabular-nums"
              style={{
                fontSize: `${podCounterFontSizePx}px`,
                lineHeight: 1.1,
                letterSpacing:
                  podCounterFontSizePx <= 15 ? '-0.02em' : '-0.01em',
                color: effectiveColor,
                opacity: isPreviewing ? 1 : isDark ? 0.42 : 0.56,
                textShadow:
                  isPreviewing && isDark ? `0 0 8px ${effectiveColor}` : 'none',
              }}
            >
              {podsCounter}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${isPreviewing || k8sStatus.tone !== 'healthy' ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: k8sStatusColor,
                  boxShadow: isPreviewing
                    ? `0 0 ${isDark ? 8 : 4}px ${k8sStatusColor}`
                    : 'none',
                }}
              />
              <span
                className="font-mono text-[8px]"
                style={{ color: k8sStatusColor, opacity: 0.76 }}
              >
                {k8sStatus.text}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-black/5 px-2 py-1.5">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="font-mono text-[7px] uppercase tracking-[0.16em]"
                  style={{ color: cpuGaugeColor, opacity: 0.82 }}
                >
                  cpu
                </span>
              </div>
              <div className="flex justify-center">
                <CircularGauge
                  value={clamp(cpuValue, 0, 100)}
                  color={cpuGaugeColor}
                  size={42}
                  isFocused={isPreviewing}
                  isDark={isDark}
                  label={`${Math.round(cpuValue)}%`}
                  labelFontSize={14}
                />
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/5 px-2 py-1.5">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="font-mono text-[7px] uppercase tracking-[0.16em]"
                  style={{ color: memoryGaugeColor, opacity: 0.82 }}
                >
                  memory
                </span>
              </div>
              <div className="flex justify-center">
                <CircularGauge
                  value={clamp(memoryValue, 0, 100)}
                  color={memoryGaugeColor}
                  size={42}
                  isFocused={isPreviewing}
                  isDark={isDark}
                  label={`${Math.round(memoryValue)}%`}
                  labelFontSize={14}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`leading-3.5 h-[29px] overflow-hidden border-t pt-1 font-mono text-[8px] ${isDark ? 'border-white/5 text-neutral-500' : 'border-black/5 text-neutral-500'}`}
        style={{
          opacity: isPreviewing ? 0.9 : isDark ? 0.42 : 0.56,
          color: visualState === 'normal' ? undefined : effectiveColor,
        }}
      >
        {compositeMeta.detail}
      </div>
    </div>
  )
}

const leftWidgetGroups: MetricLayoutGroup[] = [
  {
    items: [
      {
        kind: 'composite',
        id: 'traffic_flow',
        label: 'traffic flow',
        colorIndex: 0,
      },
    ],
  },
  {
    direction: 'row',
    items: [
      {
        kind: 'single',
        id: 'queue',
        type: 'bars',
        label: 'queue',
        colorIndex: 7,
      },
      { kind: 'single', id: 'lb', type: 'status', label: 'lb', colorIndex: 2 },
    ],
  },
  {
    direction: 'row',
    items: [
      {
        kind: 'single',
        id: 'targets',
        type: 'counter',
        label: 'targets',
        colorIndex: 5,
      },
      {
        kind: 'single',
        id: 'errors',
        type: 'sparkline',
        label: 'errors',
        colorIndex: 4,
      },
    ],
  },
]

const rightWidgetGroups: MetricLayoutGroup[] = [
  {
    items: [
      { kind: 'composite', id: 'capacity', label: 'capacity', colorIndex: 2 },
    ],
  },
  {
    direction: 'row',
    items: [
      {
        kind: 'single',
        id: 'uptime',
        type: 'gauge',
        label: 'uptime',
        colorIndex: 2,
      },
      {
        kind: 'single',
        id: 'postgres',
        type: 'status',
        label: 'postgres',
        colorIndex: 2,
      },
    ],
  },
  {
    direction: 'row',
    items: [
      {
        kind: 'single',
        id: 'redis',
        type: 'status',
        label: 'redis',
        colorIndex: 0,
      },
    ],
  },
]

export default function MetricWidgets() {
  const [shouldRender, setShouldRender] = useState(getShouldRenderMetricWidgets)
  const cluster = useAmbientClusterSnapshot()
  const [isDark, setIsDark] = useState(true)
  const monitoring = deriveAmbientMonitoringState(cluster)

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

  if (!shouldRender) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-5 top-1/2 flex max-h-[80vh] -translate-y-1/2 flex-col gap-3 overflow-hidden">
        {leftWidgetGroups.map((group, groupIndex) => (
          <div
            key={`left-group-${groupIndex}`}
            className={`flex gap-2 ${group.direction === 'row' ? 'flex-row' : 'flex-col'}`}
          >
            {group.items.map((widget, itemIndex) =>
              widget.kind === 'single' ? (
                <MetricWidget
                  key={`left-${widget.id}`}
                  {...widget}
                  delay={getGroupDelay(leftWidgetGroups, groupIndex, itemIndex)}
                  isFocused={cluster.focusMode === 'preview'}
                  cluster={cluster}
                  isDark={isDark}
                  mode={monitoring.mode}
                />
              ) : (
                <CompositeMetricWidget
                  key={`left-${widget.id}`}
                  {...widget}
                  delay={getGroupDelay(leftWidgetGroups, groupIndex, itemIndex)}
                  isFocused={cluster.focusMode === 'preview'}
                  cluster={cluster}
                  isDark={isDark}
                  mode={monitoring.mode}
                />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="absolute right-5 top-1/2 flex max-h-[80vh] -translate-y-1/2 flex-col gap-3 overflow-hidden">
        {rightWidgetGroups.map((group, groupIndex) => (
          <div
            key={`right-group-${groupIndex}`}
            className={`flex gap-2 ${group.direction === 'row' ? 'flex-row' : 'flex-col'}`}
          >
            {group.items.map((widget, itemIndex) =>
              widget.kind === 'single' ? (
                <MetricWidget
                  key={`right-${widget.id}`}
                  {...widget}
                  delay={getGroupDelay(
                    rightWidgetGroups,
                    groupIndex,
                    itemIndex,
                    100,
                  )}
                  isFocused={cluster.focusMode === 'preview'}
                  cluster={cluster}
                  isDark={isDark}
                  mode={monitoring.mode}
                />
              ) : (
                <CompositeMetricWidget
                  key={`right-${widget.id}`}
                  {...widget}
                  delay={getGroupDelay(
                    rightWidgetGroups,
                    groupIndex,
                    itemIndex,
                    100,
                  )}
                  isFocused={cluster.focusMode === 'preview'}
                  cluster={cluster}
                  isDark={isDark}
                  mode={monitoring.mode}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
