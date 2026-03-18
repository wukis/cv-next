'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { type ClusterSnapshot } from '@/lib/ambientCluster'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'
import {
  type AmbientSemanticMode,
  deriveAmbientMonitoringState,
} from '@/lib/ambientMonitoring'
import { getRequiredArrayItem } from '@/lib/assert'

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

type WidgetType =
  | 'sparkline'
  | 'bars'
  | 'gauge'
  | 'counter'
  | 'status'
  | 'fanout'
  | 'router'
  | 'orchestrator'
  | 'pipeline'
  | 'heatmap'
  | 'rings'
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

function AvailabilityRings({
  cluster,
  uptimeValue,
  color,
  phase,
  isFocused = false,
  isDark = true,
  size = 42,
}: {
  cluster: ClusterSnapshot
  uptimeValue: number
  color: string
  phase: number
  isFocused?: boolean
  isDark?: boolean
  size?: number
}) {
  const padding = 4
  const strokeWidth = 3
  const viewSize = size + padding * 2
  const center = padding + size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const totalReplicas = Math.max(cluster.replicaTarget, 1)
  const readyRatio = clamp(cluster.readyReplicas / totalReplicas, 0, 1)
  const startingRatio = clamp(cluster.startingReplicas / totalReplicas, 0, 1)
  const drainingRatio = clamp(cluster.drainingReplicas / totalReplicas, 0, 1)
  const unhealthyRatio = clamp(cluster.unhealthyReplicas / totalReplicas, 0, 1)
  const orbitAngle = phase * (isFocused ? 0.12 : 0.06)
  const orbitRadius = radius + 3.5
  const orbitX = center + Math.cos(orbitAngle - Math.PI / 2) * orbitRadius
  const orbitY = center + Math.sin(orbitAngle - Math.PI / 2) * orbitRadius
  const startingColor = isDark ? '#38bdf8' : '#0369a1'
  const drainingColor = isDark ? '#f59e0b' : '#c2410c'
  const unhealthyColor = isDark ? '#fb7185' : '#be123c'

  return (
    <svg
      width={viewSize}
      height={viewSize}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      style={{ overflow: 'visible' }}
    >
      <g transform={`rotate(-90 ${center} ${center})`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={
            isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.28)'
          }
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * readyRatio} ${circumference}`}
          style={{
            filter:
              isFocused && isDark ? `drop-shadow(0 0 6px ${color})` : 'none',
          }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius - 5}
          fill="none"
          stroke={startingColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeDasharray={`${circumference * startingRatio * 0.72} ${circumference}`}
          strokeDashoffset={-circumference * 0.08}
          opacity={0.9}
        />
        <circle
          cx={center}
          cy={center}
          r={radius - 8.5}
          fill="none"
          stroke={drainingColor}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray={`${circumference * drainingRatio * 0.68} ${circumference}`}
          strokeDashoffset={-circumference * 0.34}
          opacity={0.86}
        />
        <circle
          cx={center}
          cy={center}
          r={radius - 12}
          fill="none"
          stroke={unhealthyColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={`${circumference * unhealthyRatio * 0.62} ${circumference}`}
          strokeDashoffset={-circumference * 0.56}
          opacity={0.88}
        />
      </g>
      <circle
        cx={orbitX}
        cy={orbitY}
        r={isFocused ? 2.3 : 1.8}
        fill={color}
        opacity={isFocused ? 0.95 : 0.72}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isDark ? '#e2e8f0' : '#0f172a'}
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '8px',
          fontWeight: 700,
          opacity: isFocused ? 0.96 : 0.8,
        }}
      >
        {uptimeValue.toFixed(2)}
      </text>
    </svg>
  )
}

function TargetFanoutChart({
  cluster,
  color,
  isFocused = false,
  isDark = true,
  width = 102,
  height = 38,
}: {
  cluster: ClusterSnapshot
  color: string
  isFocused?: boolean
  isDark?: boolean
  width?: number
  height?: number
}) {
  const totalNodes = 8
  const activeNodes = clamp(cluster.loadBalancerTargets.length, 0, totalNodes)
  const centerX = 18
  const centerY = height / 2
  const columns = [65, 85]
  const rows = [8, 17, 26, 35]

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {rows.flatMap((y, rowIndex) =>
        columns.map((x, columnIndex) => {
          const nodeIndex = rowIndex * columns.length + columnIndex
          const isActive = nodeIndex < activeNodes
          const lineOpacity = isActive ? (isFocused ? 0.82 : 0.56) : 0.12
          const nodeColor = isActive
            ? color
            : isDark
              ? 'rgba(148, 163, 184, 0.28)'
              : 'rgba(148, 163, 184, 0.4)'

          return (
            <g key={`${x}-${y}`}>
              <path
                d={`M ${centerX} ${centerY} Q 42 ${centerY} ${x} ${y}`}
                fill="none"
                stroke={isActive ? color : nodeColor}
                strokeWidth={isActive ? 1.6 : 1}
                strokeOpacity={lineOpacity}
                strokeDasharray={isActive ? '0' : '2 4'}
              />
              <circle
                cx={x}
                cy={y}
                r={isActive ? 2.8 : 2.2}
                fill={nodeColor}
                style={{
                  filter:
                    isActive && isFocused && isDark
                      ? `drop-shadow(0 0 4px ${color})`
                      : 'none',
                }}
              />
            </g>
          )
        }),
      )}
      <circle
        cx={centerX}
        cy={centerY}
        r={5.5}
        fill={isDark ? 'rgba(2, 6, 23, 0.82)' : 'rgba(255, 255, 255, 0.82)'}
        stroke={color}
        strokeWidth={1.4}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={2}
        fill={color}
        opacity={isFocused ? 0.95 : 0.8}
      />
    </svg>
  )
}

function LoadBalancerRouteChart({
  cluster,
  mode,
  phase,
  color,
  isFocused = false,
  isDark = true,
  width = 102,
  height = 38,
}: {
  cluster: ClusterSnapshot
  mode: AmbientSemanticMode
  phase: number
  color: string
  isFocused?: boolean
  isDark?: boolean
  width?: number
  height?: number
}) {
  const sourceX = 10
  const gateX = 34
  const gateY = height / 2
  const targetX = 84
  const targetYs = [7, 15, 23, 31]
  const activeTargets = clamp(
    cluster.loadBalancerTargets.length,
    0,
    targetYs.length,
  )
  const routeColor =
    mode === 'incident' && isScenario(cluster, 'failover')
      ? isDark
        ? '#fb7185'
        : '#be123c'
      : color
  const pulseCount = activeTargets > 2 ? 3 : 2
  const pulseSpeed =
    mode === 'incident' || cluster.errorRate > 3.5
      ? 0.18
      : isFocused
        ? 0.12
        : 0.08

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={`M ${sourceX} ${gateY} L ${gateX - 8} ${gateY}`}
        fill="none"
        stroke={routeColor}
        strokeWidth={1.8}
        strokeOpacity={0.76}
      />
      {targetYs.map((targetY, index) => {
        const isActive = index < activeTargets
        const lineOpacity = isActive ? (isFocused ? 0.86 : 0.62) : 0.12
        const nodeFill = isActive
          ? routeColor
          : isDark
            ? 'rgba(148, 163, 184, 0.22)'
            : 'rgba(148, 163, 184, 0.32)'
        const pulseNodes = isActive
          ? Array.from({ length: pulseCount }, (_, pulseIndex) => {
              const t =
                (phase * pulseSpeed + pulseIndex / pulseCount + index * 0.11) %
                1
              const x = gateX + (targetX - gateX) * t
              const y = gateY + (targetY - gateY) * t

              return (
                <circle
                  key={pulseIndex}
                  cx={x}
                  cy={y}
                  r={1.35}
                  fill={routeColor}
                  opacity={0.3 + (1 - t) * 0.6}
                />
              )
            })
          : null

        return (
          <g key={targetY}>
            <path
              d={`M ${gateX + 8} ${gateY} Q 58 ${gateY} ${targetX} ${targetY}`}
              fill="none"
              stroke={isActive ? routeColor : nodeFill}
              strokeWidth={isActive ? 1.6 : 1}
              strokeOpacity={lineOpacity}
              strokeDasharray={isActive ? '0' : '2.5 4'}
            />
            {pulseNodes}
            <circle
              cx={targetX}
              cy={targetY}
              r={isActive ? 2.7 : 2.2}
              fill={nodeFill}
              style={{
                filter:
                  isActive && isFocused && isDark
                    ? `drop-shadow(0 0 4px ${routeColor})`
                    : 'none',
              }}
            />
          </g>
        )
      })}
      <circle
        cx={sourceX}
        cy={gateY}
        r={4.4}
        fill={isDark ? 'rgba(2, 6, 23, 0.86)' : 'rgba(255, 255, 255, 0.88)'}
        stroke={routeColor}
        strokeWidth={1.4}
      />
      <rect
        x={gateX - 7}
        y={gateY - 6}
        width={14}
        height={12}
        rx={4}
        fill={isDark ? 'rgba(2, 6, 23, 0.9)' : 'rgba(255, 255, 255, 0.92)'}
        stroke={routeColor}
        strokeWidth={1.4}
      />
      <path
        d={`M ${gateX - 2.5} ${gateY + 3.2} L ${gateX + 3.5} ${gateY} L ${gateX - 2.5} ${gateY - 3.2}`}
        fill="none"
        stroke={routeColor}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      />
    </svg>
  )
}

function ControlPlaneChart({
  cluster,
  mode,
  phase,
  isDark = true,
  width = 102,
  height = 38,
}: {
  cluster: ClusterSnapshot
  mode: AmbientSemanticMode
  phase: number
  isDark?: boolean
  width?: number
  height?: number
}) {
  const centerX = 20
  const centerY = height / 2
  const radius = 10
  const reconcileLoad = clamp(
    cluster.startingReplicas * 24 +
      cluster.drainingReplicas * 28 +
      cluster.unhealthyReplicas * 34 +
      Math.abs(cluster.replicaTarget - cluster.readyReplicas) * 12 +
      (mode === 'incident' ? 18 : 0) +
      (mode === 'surge' ? 10 : 0),
    4,
    100,
  )
  const track = 2 * Math.PI * radius
  const reconcileColor =
    mode === 'incident'
      ? isDark
        ? '#fb7185'
        : '#be123c'
      : mode === 'recovery'
        ? isDark
          ? '#4ade80'
          : '#15803d'
        : isDark
          ? '#38bdf8'
          : '#0369a1'
  const laneData = [
    {
      label: 'start',
      value: clamp(
        cluster.startingReplicas * 36 + cluster.trafficIntensity * 28,
        0,
        100,
      ),
      color: isDark ? '#38bdf8' : '#0369a1',
    },
    {
      label: 'drain',
      value: clamp(
        cluster.drainingReplicas * 40 + cluster.terminatingReplicas * 18,
        0,
        100,
      ),
      color: isDark ? '#f59e0b' : '#c2410c',
    },
    {
      label: 'heal',
      value: clamp(
        cluster.unhealthyReplicas * 42 + cluster.errorRate * 7,
        0,
        100,
      ),
      color: isDark ? '#fb7185' : '#be123c',
    },
  ]

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <g transform={`rotate(-90 ${centerX} ${centerY})`}>
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={
            isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.28)'
          }
          strokeWidth={2}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={reconcileColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${track * (reconcileLoad / 100)} ${track}`}
          style={{
            filter: isDark ? `drop-shadow(0 0 5px ${reconcileColor})` : 'none',
          }}
        />
      </g>
      {Array.from({ length: 3 }, (_, index) => {
        const angle = phase * 0.16 + index * ((Math.PI * 2) / 3)
        const x = centerX + Math.cos(angle) * (radius + 4)
        const y = centerY + Math.sin(angle) * (radius + 4)

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={1.7}
            fill={reconcileColor}
            opacity={0.72}
          />
        )
      })}
      <circle
        cx={centerX}
        cy={centerY}
        r={3}
        fill={reconcileColor}
        opacity={0.84}
      />
      {laneData.map((lane, index) => {
        const x = 44
        const y = 7 + index * 10
        const pulseT = (phase * 0.14 + index * 0.22) % 1
        const pulseX = x + 12 + pulseT * 36
        const laneOpacity = 0.2 + lane.value / 140

        return (
          <g key={lane.label}>
            <text
              x={x}
              y={y + 3}
              fill={lane.color}
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '5px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.76,
              }}
            >
              {lane.label}
            </text>
            <rect
              x={x + 12}
              y={y}
              width={40}
              height={5}
              rx={2.5}
              fill={
                isDark ? 'rgba(15, 23, 42, 0.56)' : 'rgba(226, 232, 240, 0.76)'
              }
            />
            <rect
              x={x + 12}
              y={y}
              width={40 * (lane.value / 100)}
              height={5}
              rx={2.5}
              fill={lane.color}
              opacity={laneOpacity}
            />
            {lane.value > 10 ? (
              <circle
                cx={pulseX}
                cy={y + 2.5}
                r={1.3}
                fill={lane.color}
                opacity={0.92}
              />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

function ReplicationPipelineChart({
  cluster,
  mode,
  phase,
  isDark = true,
  width = 102,
  height = 38,
}: {
  cluster: ClusterSnapshot
  mode: AmbientSemanticMode
  phase: number
  isDark?: boolean
  width?: number
  height?: number
}) {
  const isIncident = mode === 'incident' && cluster.scenarioKey === 'dbDown'
  const isRecovery = mode === 'recovery' && cluster.scenarioKey === 'dbDown'
  const pipelineColor = isIncident
    ? isDark
      ? '#fb7185'
      : '#be123c'
    : isRecovery
      ? isDark
        ? '#4ade80'
        : '#15803d'
      : isDark
        ? '#38bdf8'
        : '#0369a1'
  const nodes = [
    { x: 16, y: 19, label: 'P' },
    { x: 50, y: 12, label: 'R' },
    { x: 84, y: 26, label: 'S' },
  ]
  const pulseT = (phase * 0.11) % 1

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d="M 16 19 C 28 19 34 12 50 12"
        fill="none"
        stroke={pipelineColor}
        strokeWidth={1.7}
        strokeOpacity={0.78}
        strokeDasharray={isIncident ? '3 4' : '0'}
      />
      <path
        d="M 50 12 C 62 12 70 26 84 26"
        fill="none"
        stroke={pipelineColor}
        strokeWidth={1.7}
        strokeOpacity={0.72}
        strokeDasharray={isIncident ? '3 4' : '0'}
      />
      {[0.1, 0.58].map((offset) => {
        const t = (pulseT + offset) % 1
        const x =
          t < 0.5
            ? 16 + (50 - 16) * (t / 0.5)
            : 50 + (84 - 50) * ((t - 0.5) / 0.5)
        const y =
          t < 0.5
            ? 19 + (12 - 19) * (t / 0.5)
            : 12 + (26 - 12) * ((t - 0.5) / 0.5)

        return (
          <circle key={offset} cx={x} cy={y} r={1.8} fill={pipelineColor} />
        )
      })}
      {nodes.map((node) => (
        <g key={node.label}>
          <circle
            cx={node.x}
            cy={node.y}
            r={5}
            fill={isDark ? 'rgba(2, 6, 23, 0.86)' : 'rgba(255, 255, 255, 0.9)'}
            stroke={pipelineColor}
            strokeWidth={1.3}
          />
          <text
            x={node.x}
            y={node.y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={pipelineColor}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '6px',
              fontWeight: 700,
            }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function CacheHeatGrid({
  cluster,
  mode,
  phase,
  isDark = true,
  width = 102,
  height = 38,
}: {
  cluster: ClusterSnapshot
  mode: AmbientSemanticMode
  phase: number
  isDark?: boolean
  width?: number
  height?: number
}) {
  const columns = 5
  const rows = 4
  const gap = 3
  const cellWidth = (width - gap * (columns - 1)) / columns
  const cellHeight = (height - gap * (rows - 1)) / rows
  const heatBias =
    cluster.queueDepth * 0.6 +
    cluster.latencyMs * 0.22 +
    cluster.trafficIntensity * 28 +
    (mode === 'incident' && cluster.scenarioKey === 'cacheReload' ? 22 : 0)

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: rows * columns }, (_, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const wave =
          Math.sin(phase * 0.24 + index * 0.8) * 12 +
          Math.cos(phase * 0.12 + row * 0.6) * 8
        const intensity = clamp(heatBias + wave + column * 6 - row * 3, 0, 100)
        const fill =
          intensity > 76
            ? isDark
              ? '#fb7185'
              : '#e11d48'
            : intensity > 54
              ? isDark
                ? '#f59e0b'
                : '#d97706'
              : intensity > 34
                ? isDark
                  ? '#38bdf8'
                  : '#0284c7'
                : isDark
                  ? 'rgba(56, 189, 248, 0.18)'
                  : 'rgba(2, 132, 199, 0.16)'

        return (
          <rect
            key={index}
            x={column * (cellWidth + gap)}
            y={row * (cellHeight + gap)}
            width={cellWidth}
            height={cellHeight}
            rx={2.4}
            fill={fill}
            opacity={0.3 + intensity / 120}
          />
        )
      })}
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
          mode === 'recovery'
            ? 'availability horizon healing'
            : 'availability envelope',
        detail: `${cluster.readyReplicas}/${cluster.replicaTarget} ready across live service lanes`,
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
            ? 'fanout lanes narrowed'
            : 'fanout lanes open',
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
            ? 'replication path backing off'
            : 'primary replica path aligned',
        detail:
          cluster.errorRate > 6
            ? 'replication lag visible'
            : 'commit path healthy',
      }
    case 'redis':
      return {
        lead:
          mode === 'incident' && isScenario(cluster, 'cacheReload')
            ? 'cache tiles warming'
            : 'cache heat balanced',
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
  const [animationPhase, setAnimationPhase] = useState(0)
  const stateRef = useRef({ cluster, mode })
  const metricMotionRef = useRef({
    previousErrorRate: cluster.errorRate,
    previousQueueDepth: cluster.queueDepth,
    previousUnhealthyReplicas: cluster.unhealthyReplicas,
    errorShock: 0,
    queueShock: 0,
  })

  useEffect(() => {
    stateRef.current = { cluster, mode }
  }, [cluster, mode])

  useEffect(() => {
    const appearTimeout = setTimeout(() => setVisible(true), delay)
    const interval = setInterval(() => {
      const { cluster: snapshot, mode: currentMode } = stateRef.current
      const targetValue = getTargetValue(id, snapshot, currentMode)
      const metricMotion = metricMotionRef.current
      const errorJump = Math.max(
        0,
        snapshot.errorRate - metricMotion.previousErrorRate,
      )
      const unhealthyJump = Math.max(
        0,
        snapshot.unhealthyReplicas - metricMotion.previousUnhealthyReplicas,
      )
      const queueJump = Math.max(
        0,
        snapshot.queueDepth - metricMotion.previousQueueDepth,
      )

      metricMotion.errorShock = clamp(
        metricMotion.errorShock * 0.42 +
          errorJump * 18 +
          unhealthyJump * 10 +
          (snapshot.emergencyState === 'emergency' ? 8 : 0) +
          (currentMode === 'incident' ? 6 : 0),
        0,
        54,
      )
      metricMotion.queueShock = clamp(
        metricMotion.queueShock * 0.56 +
          queueJump * 0.62 +
          (snapshot.scenarioKey === 'queueFull' &&
          snapshot.emergencyState === 'emergency'
            ? 10
            : 0),
        0,
        28,
      )

      if (type === 'sparkline') {
        setData((previous) => {
          const next = [...previous.slice(1)]
          const current = getRequiredArrayItem(
            previous,
            previous.length - 1,
            'Expected a previous sparkline point.',
          )
          const drift =
            id === 'errors'
              ? (targetValue - current) * 0.44 +
                metricMotion.errorShock * (0.34 + Math.random() * 0.12) +
                (Math.random() - 0.5) * 4
              : (targetValue - current) * 0.32 + (Math.random() - 0.5) * 5
          const nextValue = clamp(current + drift, 4, 98)
          next.push(
            id === 'errors'
              ? Math.max(
                  nextValue,
                  clamp(targetValue + metricMotion.errorShock * 0.38, 6, 100),
                )
              : nextValue,
          )
          return next
        })
      }

      if (type === 'bars') {
        const nextBars = getBarValues(id, snapshot, currentMode)
        setBars(
          id === 'queue'
            ? nextBars.map((value, index) =>
                clamp(
                  value +
                    metricMotion.queueShock * (0.28 + index * 0.08) +
                    (snapshot.emergencyState === 'emergency' ? index * 2 : 0),
                  8,
                  100,
                ),
              )
            : nextBars,
        )
      }

      if (type === 'gauge' || type === 'rings') {
        setValue((previous) => previous + (targetValue - previous) * 0.28)
      }

      metricMotion.previousErrorRate = snapshot.errorRate
      metricMotion.previousQueueDepth = snapshot.queueDepth
      metricMotion.previousUnhealthyReplicas = snapshot.unhealthyReplicas
    }, 1200)
    const animationInterval = setInterval(() => {
      setAnimationPhase((previous) => previous + 1)
    }, 240)

    return () => {
      clearTimeout(appearTimeout)
      clearInterval(interval)
      clearInterval(animationInterval)
    }
  }, [delay, id, type])

  const baseColor = isDark
    ? getRequiredArrayItem(
        darkModeColors,
        colorIndex,
        `Missing dark widget color at index ${colorIndex}.`,
      )
    : getRequiredArrayItem(
        lightModeColors,
        colorIndex,
        `Missing light widget color at index ${colorIndex}.`,
      )
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
  const hideWidgetLead = type === 'rings' && id === 'uptime'

  return (
    <div
      className={`flex w-[124px] flex-col gap-1.5 rounded-xl border px-2.5 py-2 backdrop-blur-xs transition-all duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-2 opacity-0'} ${borderColor} ${bgColor} ${isPreviewing && visualState === 'error' ? 'animate-pulse' : ''} `}
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
          className={`block h-[10px] truncate font-mono text-[8px] tracking-wider uppercase transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
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
        {!hideWidgetLead ? (
          <span
            className={`block h-[10px] truncate font-mono text-[7px] tracking-[0.16em] whitespace-nowrap uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}
            style={{
              opacity: isPreviewing ? 0.7 : 0.42,
              color: effectiveColor,
            }}
          >
            {widgetMeta.lead}
          </span>
        ) : null}
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
            {...(id === 'uptime' ? {} : { label: `${Math.round(value)}%` })}
          />
          <span
            className="min-w-[52px] text-right font-mono text-[9px] whitespace-nowrap tabular-nums transition-all duration-300"
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

      {type === 'rings' ? (
        <div className="flex items-center justify-between gap-2">
          <AvailabilityRings
            cluster={cluster}
            uptimeValue={value}
            color={effectiveColor}
            phase={animationPhase}
            isFocused={isPreviewing}
            isDark={isDark}
            size={46}
          />
          <div className="min-w-[52px] text-right font-mono">
            <div
              className="text-[9px] whitespace-nowrap tabular-nums transition-all duration-300"
              style={{
                color: effectiveColor,
                opacity: isPreviewing ? 1 : isDark ? 0.34 : 0.48,
                textShadow:
                  isPreviewing && isDark ? `0 0 6px ${effectiveColor}` : 'none',
                fontWeight: isDark ? 500 : 600,
              }}
            >
              {value.toFixed(2)}%
            </div>
            <div
              className={`text-[7px] tracking-[0.14em] uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}
              style={{ opacity: isPreviewing ? 0.68 : 0.42 }}
            >
              {cluster.readyReplicas}/{cluster.replicaTarget} ready
            </div>
          </div>
        </div>
      ) : null}

      {type === 'counter' ? (
        <span
          className="min-h-[16px] font-mono text-[13px] font-medium whitespace-nowrap tabular-nums transition-all duration-300"
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

      {type === 'fanout' ? (
        <div className="w-full">
          <TargetFanoutChart
            cluster={cluster}
            color={effectiveColor}
            isFocused={isPreviewing}
            isDark={isDark}
          />
        </div>
      ) : null}

      {type === 'router' ? (
        <div className="w-full">
          <LoadBalancerRouteChart
            cluster={cluster}
            mode={mode}
            phase={animationPhase}
            color={effectiveColor}
            isFocused={isPreviewing}
            isDark={isDark}
          />
        </div>
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
            className={`min-w-[44px] font-mono text-[9px] whitespace-nowrap transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
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

      {type === 'orchestrator' ? (
        <div className="w-full">
          <ControlPlaneChart
            cluster={cluster}
            mode={mode}
            phase={animationPhase}
            isDark={isDark}
          />
        </div>
      ) : null}

      {type === 'pipeline' ? (
        <div className="w-full">
          <ReplicationPipelineChart
            cluster={cluster}
            mode={mode}
            phase={animationPhase}
            isDark={isDark}
          />
        </div>
      ) : null}

      {type === 'heatmap' ? (
        <div className="w-full">
          <CacheHeatGrid
            cluster={cluster}
            mode={mode}
            phase={animationPhase}
            isDark={isDark}
          />
        </div>
      ) : null}

      <div
        className={`h-[29px] overflow-hidden border-t pt-1 font-mono text-[8px] leading-3.5 ${isDark ? 'border-white/5 text-neutral-500' : 'border-black/5 text-neutral-500'}`}
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
          const current = getRequiredArrayItem(
            previous,
            previous.length - 1,
            'Expected a previous request-rate point.',
          )
          const drift =
            (requestTarget - current) * 0.46 +
            Math.sin(requestPace.phase * 1.3) * 2.4 +
            (Math.random() - 0.5) * (6 + requestPace.burst * 0.16)
          next.push(clamp(current + drift, 4, 98))
          return next
        })

        setLatencyData((previous) => {
          const next = [...previous.slice(1)]
          const current = getRequiredArrayItem(
            previous,
            previous.length - 1,
            'Expected a previous latency point.',
          )
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
    ? getRequiredArrayItem(
        darkModeColors,
        colorIndex,
        `Missing dark widget color at index ${colorIndex}.`,
      )
    : getRequiredArrayItem(
        lightModeColors,
        colorIndex,
        `Missing light widget color at index ${colorIndex}.`,
      )
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
      className={`flex w-[258px] flex-col gap-2 rounded-xl border px-3 py-2.5 backdrop-blur-xs transition-all duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-2 opacity-0'} ${borderColor} ${bgColor} ${isPreviewing && visualState === 'error' ? 'animate-pulse' : ''} `}
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
          className={`block h-[10px] truncate font-mono text-[8px] tracking-wider uppercase transition-all duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
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
          className={`block h-[10px] truncate font-mono text-[7px] tracking-[0.16em] whitespace-nowrap uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}
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
              className="font-mono text-[7px] tracking-[0.16em] uppercase"
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
                  className="font-mono text-[7px] tracking-[0.16em] uppercase"
                  style={{ color: effectiveColor, opacity: 0.78 }}
                >
                  request pace
                </span>
                <span
                  className="min-w-[52px] text-right font-mono text-[8px] whitespace-nowrap tabular-nums"
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
                  className="font-mono text-[7px] tracking-[0.16em] uppercase"
                  style={{ color: latencyTraceColor, opacity: 0.82 }}
                >
                  tail latency
                </span>
                <span
                  className="min-w-[52px] text-right font-mono text-[8px] whitespace-nowrap tabular-nums"
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
              className="font-mono text-[7px] tracking-[0.16em] uppercase"
              style={{
                color: effectiveColor,
                opacity: isPreviewing ? 0.8 : 0.5,
              }}
            >
              pod set
            </span>
            <span
              className="font-mono font-semibold whitespace-nowrap tabular-nums"
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
                  className="font-mono text-[7px] tracking-[0.16em] uppercase"
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
                  className="font-mono text-[7px] tracking-[0.16em] uppercase"
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
        className={`h-[29px] overflow-hidden border-t pt-1 font-mono text-[8px] leading-3.5 ${isDark ? 'border-white/5 text-neutral-500' : 'border-black/5 text-neutral-500'}`}
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
      { kind: 'single', id: 'lb', type: 'router', label: 'lb', colorIndex: 2 },
    ],
  },
  {
    direction: 'row',
    items: [
      {
        kind: 'single',
        id: 'targets',
        type: 'fanout',
        label: 'fanout',
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
        type: 'rings',
        label: 'availability',
        colorIndex: 2,
      },
      {
        kind: 'single',
        id: 'postgres',
        type: 'pipeline',
        label: 'replication',
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
        type: 'heatmap',
        label: 'cache heat',
        colorIndex: 0,
      },
      {
        kind: 'single',
        id: 'k8s',
        type: 'orchestrator',
        label: 'control',
        colorIndex: 2,
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
      <div className="absolute top-1/2 left-5 flex max-h-[80vh] -translate-y-1/2 flex-col gap-3 overflow-hidden">
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

      <div className="absolute top-1/2 right-5 flex max-h-[80vh] -translate-y-1/2 flex-col gap-3 overflow-hidden">
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
