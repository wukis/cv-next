'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  type AmbientCallAssignment,
  type ClusterEventEntry,
  type ClusterNodeLifecycle,
  type ClusterNodeRole,
  type ClusterSnapshot,
  dispatchClusterEvent,
  dispatchClusterSnapshot,
  type EmergencyScenarioKey,
  NETWORK_CALL_ASSIGNMENTS_EVENT,
  TRIGGER_NETWORK_EMERGENCY_EVENT,
  type TriggerSource,
} from '@/lib/ambientCluster'
import { getRequiredArrayItem } from '@/lib/assert'

import {
  createStatusIndicator,
  drawStatusIndicator,
  getBasePacketInterval,
  getConnectionBaseOpacity,
  getConnectionStrokeColor,
  getPacketDirection,
  getPacketSize,
  getPacketSpeed,
  getPacketType,
  getServiceStatusDisplay,
} from './hexagon-network/connections'
import {
  APP_SERVICE_ORDER,
  AUTO_EMERGENCY_INTERVAL_SECONDS,
  AUTO_EMERGENCY_JITTER_SECONDS,
  BASE_HEX_SIZE,
  CAMERA_BASE_ZOOM_FOCUSED,
  CAMERA_BASE_ZOOM_IDLE,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  COLORS,
  DRAIN_DURATION,
  PERSPECTIVE,
  POD_LAYOUT_DAMPING,
  POD_LAYOUT_STIFFNESS,
  ROLE_COLORS,
  ROTATION_SPEED_FOCUSED,
  ROTATION_SPEED_NORMAL,
  SCALE_DOWN_DRAIN_DURATION,
  SNAPSHOT_INTERVAL,
  STARTING_DURATION,
  TERMINATING_DURATION,
  TOAST_EXIT_DURATION,
  UNHEALTHY_DURATION,
} from './hexagon-network/constants'
import {
  drawHexagon,
  drawInfoPanel,
  drawPanelCallAssignments,
  drawPanelText,
  drawQuadraticSegment,
  drawRoundedRectPath,
  getQuadraticPoint,
} from './hexagon-network/drawing'
import {
  getEmergencyLogBurst,
  getEmergencyScenario,
  getEmergencyStateFromRef,
  getNodePalette,
  getNodeScaleMultiplier,
  getNodeVisibility,
  getScenarioAffectedServices,
  isScenarioAffectingNode,
  pickRandomEmergencyScenario,
} from './hexagon-network/emergency'
import {
  getHoneycombSlot,
  getServiceClusterDegradedPodCount,
  getServiceClusterFootprintPodCount,
  getServiceClusterShellRadius,
} from './hexagon-network/honeycomb'
import {
  clamp,
  getSteppedMotionLevel,
  lerp,
  randomInRange,
  withOpacity,
  wrapAngle,
} from './hexagon-network/math'
import { project3D, setCameraZoomOffset } from './hexagon-network/projection'
import {
  chooseServicePanelPlacement,
  drawServiceClusterHoneycomb,
  getProjectedServiceClusterEnvelope,
  getServiceClusterRotation,
  resolveServiceClusterCenters,
} from './hexagon-network/serviceCluster'
import type {
  AppServiceConfig,
  AppServiceGroup,
  Connection,
  ConnectionKind,
  DataPacket,
  EventToast,
  OccupiedLayoutZone,
  OccupiedPanelZone,
  ServiceNode,
  ServicePanelPlacementState,
  StatusIndicator,
} from './hexagon-network/types'

const HexagonServiceNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<ServiceNode[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const packetsRef = useRef<DataPacket[]>([])
  const statusIndicatorsRef = useRef<StatusIndicator[]>([])
  const rotationRef = useRef({ x: 0, y: 0 })
  const autoRotationXRef = useRef(0)
  const autoRotationYRef = useRef(0)
  const keyboardRotationInputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
  })
  const manualRotationRef = useRef({
    x: 0,
    y: 0,
  })
  const servicePanelPlacementRef = useRef<
    Partial<Record<AppServiceGroup, ServicePanelPlacementState>>
  >({})
  const timeRef = useRef(0)
  const nodeIdRef = useRef(0)
  const connectionIdRef = useRef(0)
  const packetIdRef = useRef(0)
  const statusIdRef = useRef(0)
  const toastIdRef = useRef(0)
  const lastAutoscaleToastAtRef = useRef(-100)
  const lastSnapshotAtRef = useRef(0)
  const lastEventIdRef = useRef(0)
  const focusTransitionRef = useRef(0)
  const frameSkipRef = useRef(0)
  const isFocusedRef = useRef(false)
  const zoomRef = useRef({
    current: 0,
    target: 0,
  })
  const appServicesRef = useRef<AppServiceConfig[]>([])
  const toastQueueRef = useRef<EventToast[]>([])
  const activeToastRef = useRef<EventToast[]>([])
  const toastSignatureRef = useRef('')
  const callAssignmentsRef = useRef<AmbientCallAssignment[]>([])
  const serviceInstanceCounterRef = useRef<Record<AppServiceGroup, number>>({
    edge: 0,
    auth: 0,
    catalog: 0,
    basket: 0,
    checkout: 0,
    warehouse: 0,
  })
  const serviceClusterMotionRef = useRef(
    APP_SERVICE_ORDER.reduce(
      (accumulator, serviceName, index) => {
        accumulator[serviceName] = {
          energy: 0,
          footprintCount: 0,
          degradedCount: 0,
          desiredCount: 0,
          pendingScaleOutSteps: 0,
          pendingScaleInSteps: 0,
          scaleRingProgress: 0,
          scaleRingDirection: 0 as 1 | -1 | 0,
          phase: index * 0.82,
        }
        return accumulator
      },
      {} as Record<
        AppServiceGroup,
        {
          energy: number
          footprintCount: number
          degradedCount: number
          desiredCount: number
          pendingScaleOutSteps: number
          pendingScaleInSteps: number
          scaleRingProgress: number
          scaleRingDirection: 1 | -1 | 0
          phase: number
        }
      >,
    ),
  )
  const [isDark, setIsDark] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [visibleToasts, setVisibleToasts] = useState<EventToast[]>([])
  const mounted = typeof window !== 'undefined'

  const clusterRef = useRef({
    desiredReplicas: 6,
    nextAmbientFailureTime: 10,
    nextAmbientRebalanceTime: 4,
    nextTrafficSpikeTime: 18,
    trafficSpikeEndTime: 0,
    isTrafficSpike: false,
    trafficSpikeLevel: 0,
    trafficSpikeSeverity: 0,
    nextTrafficTargetRefreshTime: 0,
    nextScaleActionTime: 0,
    nextScaleCooldownTime: 0,
    baselineServiceReplicas: {
      edge: 1,
      auth: 1,
      catalog: 1,
      basket: 1,
      checkout: 1,
      warehouse: 1,
    } as Record<AppServiceGroup, number>,
    desiredServiceReplicas: {
      edge: 1,
      auth: 1,
      catalog: 1,
      basket: 1,
      checkout: 1,
      warehouse: 1,
    } as Record<AppServiceGroup, number>,
  })

  const emergencyRef = useRef({
    isActive: false,
    isRecovery: false,
    scenarioKey: 'failover' as EmergencyScenarioKey,
    triggerSource: null as TriggerSource,
    startTime: 0,
    duration: 9,
    recoveryStartTime: 0,
    recoveryDuration: 4.5,
    lastEmergencyTime: 0,
    nextEmergencyInterval: AUTO_EMERGENCY_INTERVAL_SECONDS,
    hasTriggeredFirstEmergency: false,
    hasEverFocused: false,
    accumulatedFocusTime: 0,
    firstEmergencyDelay: 2.6,
    nextFailureTime: 0,
    triggeredFailures: 0,
    failureTarget: 0,
    recoveryAnnounced: false,
  })

  const getEmergencyState = useCallback(
    () => getEmergencyStateFromRef(emergencyRef.current),
    [],
  )

  const createNode = useCallback(
    (
      role: ClusterNodeRole,
      label: string,
      x: number,
      y: number,
      z: number,
      overrides?: Partial<ServiceNode>,
    ): ServiceNode => {
      const defaultLifecycle: ClusterNodeLifecycle =
        role === 'appPod' ? 'ready' : 'healthy'

      return {
        id: nodeIdRef.current++,
        role,
        lifecycleState: defaultLifecycle,
        acceptingTraffic: role !== 'appPod' || defaultLifecycle === 'ready',
        scaleDownTarget: false,
        replacementLaunched: false,
        label,
        color: ROLE_COLORS[role],
        x,
        y,
        z,
        targetX: x,
        targetY: y,
        targetZ: z,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0,
        screenX: 0,
        screenY: 0,
        screenScale: 1,
        size:
          role === 'loadBalancer'
            ? BASE_HEX_SIZE + 7
            : role === 'ingress'
              ? BASE_HEX_SIZE + 6
              : role === 'database'
                ? BASE_HEX_SIZE + 5
                : role === 'cache' || role === 'queue'
                  ? BASE_HEX_SIZE + 4
                  : role === 'worker' || role === 'observability'
                    ? BASE_HEX_SIZE + 3.5
                    : role === 'appPod'
                      ? BASE_HEX_SIZE + 1.5
                      : BASE_HEX_SIZE,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.014,
        statusSince: timeRef.current,
        bornAt: timeRef.current,
        ...overrides,
      }
    },
    [],
  )

  const getAppServiceConfig = useCallback((serviceName: AppServiceGroup) => {
    return appServicesRef.current.find(
      (service) => service.name === serviceName,
    )
  }, [])

  const createAppPod = useCallback(
    (
      serviceName: AppServiceGroup,
      x: number,
      y: number,
      z: number,
      overrides?: Partial<ServiceNode>,
    ) => {
      const service = getAppServiceConfig(serviceName)
      const nextInstance =
        (serviceInstanceCounterRef.current[serviceName] ?? 0) + 1
      serviceInstanceCounterRef.current[serviceName] = nextInstance

      return createNode(
        'appPod',
        `${service?.labelPrefix ?? serviceName}-${nextInstance}`,
        x,
        y,
        z,
        {
          replicaGroup: serviceName,
          color: service?.color ?? 'emerald',
          instanceNumber: nextInstance,
          ...overrides,
        },
      )
    },
    [createNode, getAppServiceConfig],
  )

  const buildClusterSnapshot = useCallback(
    (recentEvent?: ClusterEventEntry): ClusterSnapshot => {
      const appPods = nodesRef.current.filter((node) => node.role === 'appPod')
      const loadBalancerTargets = appPods
        .filter(
          (node) =>
            node.replicaGroup === 'edge' &&
            node.lifecycleState === 'ready' &&
            node.acceptingTraffic,
        )
        .map((node) => node.label)
      const readyReplicas = appPods.filter(
        (node) => node.lifecycleState === 'ready' && node.acceptingTraffic,
      ).length
      const startingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'starting',
      ).length
      const drainingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'draining',
      ).length
      const unhealthyReplicas = appPods.filter(
        (node) => node.lifecycleState === 'unhealthy',
      ).length
      const terminatingReplicas = appPods.filter(
        (node) => node.lifecycleState === 'terminating',
      ).length
      const emergencyState = getEmergencyState()
      const emergencyScenario = getEmergencyScenario(
        emergencyRef.current.scenarioKey,
      )
      const replicaTarget = clusterRef.current.desiredReplicas
      const pressureFactor = 1 - readyReplicas / Math.max(replicaTarget, 1)
      const emergencyFactor =
        emergencyState === 'emergency'
          ? 1
          : emergencyState === 'recovery'
            ? 0.35
            : 0
      const focusFactor = focusTransitionRef.current
      const spikeFactor = clusterRef.current.trafficSpikeLevel

      return {
        emergencyState,
        focusMode: isFocusedRef.current ? 'preview' : 'idle',
        scenarioKey:
          emergencyState === 'normal' ? null : emergencyRef.current.scenarioKey,
        isTrafficSpike: clusterRef.current.isTrafficSpike,
        triggerSource:
          emergencyState === 'normal'
            ? null
            : emergencyRef.current.triggerSource,
        replicaTarget,
        liveReplicas: appPods.length,
        readyReplicas,
        startingReplicas,
        drainingReplicas,
        unhealthyReplicas,
        terminatingReplicas,
        loadBalancerTargets,
        loadBalancerHealthy: loadBalancerTargets.length >= 1,
        requestRate:
          1200 +
          readyReplicas * 150 +
          focusFactor * 340 -
          pressureFactor * 280 +
          emergencyFactor * 120 +
          spikeFactor * 1650,
        errorRate: clamp(
          unhealthyReplicas * 4 +
            drainingReplicas * 1.4 +
            terminatingReplicas * 1.1 +
            emergencyFactor * (6 + emergencyScenario.metricImpact.errorRate),
          0.2,
          18,
        ),
        latencyMs:
          28 +
          pressureFactor * 48 +
          unhealthyReplicas * 10 +
          drainingReplicas * 7 +
          emergencyFactor * (18 + emergencyScenario.metricImpact.latencyMs),
        queueDepth: Math.round(
          8 +
            pressureFactor * 42 +
            emergencyFactor * (34 + emergencyScenario.metricImpact.queueDepth) +
            focusFactor * 10 +
            startingReplicas * 6 +
            spikeFactor * 28,
        ),
        trafficIntensity: clamp(
          0.3 +
            focusFactor * 0.55 +
            emergencyFactor *
              (0.15 + emergencyScenario.metricImpact.trafficIntensity) +
            spikeFactor * 0.26,
          0,
          1,
        ),
        ...(recentEvent ? { recentEvent } : {}),
      }
    },
    [getEmergencyState],
  )

  const emitClusterSnapshot = useCallback(
    (force = false, recentEvent?: ClusterEventEntry) => {
      const now = timeRef.current
      if (!force && now - lastSnapshotAtRef.current < SNAPSHOT_INTERVAL) {
        return
      }

      lastSnapshotAtRef.current = now
      dispatchClusterSnapshot(buildClusterSnapshot(recentEvent))
    },
    [buildClusterSnapshot],
  )

  const pushClusterEvent = useCallback(
    (
      level: ClusterEventEntry['level'],
      message: string,
      forceSnapshot = true,
    ) => {
      const event: ClusterEventEntry = {
        id: ++lastEventIdRef.current,
        level,
        message,
        timestamp: Date.now(),
      }

      dispatchClusterEvent(event)

      if (forceSnapshot) {
        emitClusterSnapshot(true, event)
      }

      return event
    },
    [emitClusterSnapshot],
  )

  const enqueueEventToast = useCallback(
    (toast: Omit<EventToast, 'id' | 'shownAt' | 'exitingAt'>) => {
      const nextToast: EventToast = {
        id: ++toastIdRef.current,
        shownAt: 0,
        exitingAt: null,
        ...toast,
      }

      toastQueueRef.current.push(nextToast)

      while (activeToastRef.current.length + toastQueueRef.current.length > 3) {
        if (activeToastRef.current.length > 0) {
          activeToastRef.current.sort(
            (left, right) => left.shownAt - right.shownAt,
          )
          activeToastRef.current.shift()
        } else {
          toastQueueRef.current.shift()
        }
      }
    },
    [],
  )

  const syncVisibleToasts = useCallback(() => {
    const nextToasts = [...activeToastRef.current].sort(
      (left, right) => left.shownAt - right.shownAt,
    )
    const nextSignature = nextToasts
      .map(
        (toast) =>
          `${toast.id}:${toast.mode}:${toast.shownAt}:${toast.exitingAt ?? 'active'}`,
      )
      .join('|')

    if (nextSignature === toastSignatureRef.current) {
      return
    }

    toastSignatureRef.current = nextSignature
    setVisibleToasts(nextToasts)
  }, [])

  const enqueueAutoscalerToast = useCallback(
    (title: string, subtitle: string, accentColor: string) => {
      if (timeRef.current - lastAutoscaleToastAtRef.current < 1.2) {
        return
      }

      lastAutoscaleToastAtRef.current = timeRef.current
      enqueueEventToast({
        title,
        subtitle,
        mode: 'autoscale',
        accentColor,
        duration: 4.4,
      })
    },
    [enqueueEventToast],
  )

  const getReadyAppPods = useCallback(() => {
    return nodesRef.current.filter(
      (node) =>
        node.role === 'appPod' &&
        node.lifecycleState === 'ready' &&
        node.acceptingTraffic,
    )
  }, [])

  const hasRollingReplacementInFlight = useCallback(() => {
    return nodesRef.current.some(
      (node) =>
        node.role === 'appPod' &&
        (node.lifecycleState === 'starting' ||
          node.lifecycleState === 'draining' ||
          node.lifecycleState === 'unhealthy' ||
          node.lifecycleState === 'terminating'),
    )
  }, [])

  const getScalingActivitySummary = useCallback(() => {
    const initialByService = APP_SERVICE_ORDER.reduce(
      (accumulator, serviceName) => {
        accumulator[serviceName] = {
          starting: 0,
          draining: 0,
        }
        return accumulator
      },
      {} as Record<
        AppServiceGroup,
        {
          starting: number
          draining: number
        }
      >,
    )

    return nodesRef.current.reduce(
      (summary, node) => {
        if (node.role !== 'appPod' || !node.replicaGroup) {
          return summary
        }

        const serviceName = node.replicaGroup as AppServiceGroup

        if (node.lifecycleState === 'starting') {
          summary.starting += 1
          summary.byService[serviceName].starting += 1
        } else if (node.lifecycleState === 'draining') {
          summary.draining += 1
          summary.byService[serviceName].draining += 1
        }

        return summary
      },
      {
        starting: 0,
        draining: 0,
        byService: initialByService,
      },
    )
  }, [])

  const getServiceReplicaCount = useCallback((serviceName: AppServiceGroup) => {
    return nodesRef.current.filter(
      (node) =>
        node.role === 'appPod' &&
        node.replicaGroup === serviceName &&
        node.lifecycleState !== 'terminating',
    ).length
  }, [])

  const getMostVisibleServiceGroups = useCallback((limit = 3) => {
    const canvas = canvasRef.current
    const services = appServicesRef.current

    if (!canvas || services.length === 0) {
      return APP_SERVICE_ORDER.slice(0, limit)
    }

    const width = canvas.clientWidth || canvas.width || 1
    const height = canvas.clientHeight || canvas.height || 1
    const centerX = width / 2
    const centerY = height / 2
    const { x: rotX, y: rotY } = rotationRef.current

    return [...services]
      .map((service) => {
        const projected = project3D(
          service.centerX,
          service.centerY,
          service.centerZ,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const normalizedDx = (projected.screenX - centerX) / (width * 0.48)
        const normalizedDy = (projected.screenY - centerY) / (height * 0.48)
        const centrality = clamp(
          1 - Math.hypot(normalizedDx, normalizedDy),
          0,
          1,
        )
        const depthWeight = clamp(projected.scale, 0.35, 1.35)
        const score = depthWeight * 0.7 + centrality * 0.9

        return {
          name: service.name,
          score,
        }
      })
      .sort((serviceA, serviceB) => serviceB.score - serviceA.score)
      .slice(0, limit)
      .map((service) => service.name)
  }, [])

  const getServicePodPlacement = useCallback(
    (serviceName: AppServiceGroup, slotIndex: number, totalSlots: number) => {
      const service = getAppServiceConfig(serviceName)

      if (!service) {
        return {
          x: randomInRange(-40, 40),
          y: randomInRange(-30, 30),
          z: randomInRange(-30, 30),
        }
      }

      const safeTotalSlots = Math.max(totalSlots, 1)
      const densityFactor = clamp(1 - (safeTotalSlots - 1) * 0.038, 0.6, 1)
      const cellRadius = 24 * densityFactor
      const honeycombX = cellRadius * Math.sqrt(3)
      const honeycombY = cellRadius * 1.5
      const depthGap = 24 * (0.76 + densityFactor * 0.34)
      const microJitter = 3.2 * densityFactor
      const slot = getHoneycombSlot(slotIndex)
      const ringDepth =
        Math.max(
          Math.abs(slot.q),
          Math.abs(slot.r),
          Math.abs(-slot.q - slot.r),
        ) * 0.16
      const xOffset = honeycombX * (slot.q + slot.r / 2)
      const yOffset = honeycombY * slot.r
      const depthWave =
        Math.sin(slotIndex * 0.9 + service.centerZ * 0.008) *
        depthGap *
        (0.5 + ringDepth)

      return {
        x:
          service.centerX +
          xOffset +
          Math.sin(slotIndex * 0.7 + service.centerX * 0.01) * microJitter,
        y:
          service.centerY +
          yOffset +
          Math.cos(slotIndex * 0.85 + service.centerY * 0.01) * microJitter,
        z:
          service.centerZ +
          ((slot.q + slot.r) % 2 === 0 ? 1 : -1) * depthGap * 1.08 +
          slot.q * 7 * densityFactor -
          slot.r * 6 * densityFactor +
          depthWave +
          Math.sin(slotIndex * 0.62 + service.centerZ * 0.01) * microJitter,
      }
    },
    [getAppServiceConfig],
  )

  const getConnectionControlPoint = useCallback(
    (
      connection: Connection,
      fromNode: ServiceNode,
      toNode: ServiceNode,
      from: ReturnType<typeof project3D>,
      to: ReturnType<typeof project3D>,
      canvasCenterX: number,
      canvasCenterY: number,
      rotX: number,
      rotY: number,
    ) => {
      const midX = (from.screenX + to.screenX) / 2
      const midY = (from.screenY + to.screenY) / 2
      const dx = to.screenX - from.screenX
      const dy = to.screenY - from.screenY
      const distance = Math.hypot(dx, dy) || 1
      const normalX = -dy / distance
      const normalY = dx / distance
      const fromGroup = fromNode.replicaGroup ?? fromNode.role
      const toGroup = toNode.replicaGroup ?? toNode.role
      const bundleKey = `${fromGroup}:${toGroup}:${connection.kind}`
      const bundleHash = Array.from(bundleKey).reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0,
      )
      const direction = bundleHash % 2 === 0 ? 1 : -1

      if (connection.kind === 'ingress') {
        return {
          x: midX,
          y: midY,
        }
      }

      let bend =
        connection.kind === 'loadBalancer'
          ? 22
          : connection.kind === 'service'
            ? 18
            : connection.kind === 'telemetry'
              ? 10
              : 14

      let anchorX = midX
      let anchorY = midY
      let anchorWeight = 0

      const fromService =
        fromNode.replicaGroup &&
        APP_SERVICE_ORDER.includes(fromNode.replicaGroup as AppServiceGroup)
          ? getAppServiceConfig(fromNode.replicaGroup as AppServiceGroup)
          : undefined
      const toService =
        toNode.replicaGroup &&
        APP_SERVICE_ORDER.includes(toNode.replicaGroup as AppServiceGroup)
          ? getAppServiceConfig(toNode.replicaGroup as AppServiceGroup)
          : undefined

      if (fromService && toService) {
        const fromCluster = getProjectedServiceClusterEnvelope(
          fromService,
          canvasCenterX,
          canvasCenterY,
          rotX,
          rotY,
        )
        const toCluster = getProjectedServiceClusterEnvelope(
          toService,
          canvasCenterX,
          canvasCenterY,
          rotX,
          rotY,
        )
        const clusterDx = toCluster.screenX - fromCluster.screenX
        const clusterDy = toCluster.screenY - fromCluster.screenY
        const clusterDistance = Math.hypot(clusterDx, clusterDy) || 1
        const fromOffset = Math.min(
          fromCluster.radius * 0.34,
          clusterDistance * 0.22,
        )
        const toOffset = Math.min(
          toCluster.radius * 0.34,
          clusterDistance * 0.22,
        )
        const fromAnchorX =
          fromCluster.screenX + (clusterDx / clusterDistance) * fromOffset
        const fromAnchorY =
          fromCluster.screenY + (clusterDy / clusterDistance) * fromOffset
        const toAnchorX =
          toCluster.screenX - (clusterDx / clusterDistance) * toOffset
        const toAnchorY =
          toCluster.screenY - (clusterDy / clusterDistance) * toOffset
        anchorX = (fromAnchorX + toAnchorX) / 2
        anchorY = (fromAnchorY + toAnchorY) / 2
        anchorWeight = 0.6
      } else if (fromService || toService) {
        const service = fromService ?? toService
        if (service) {
          const cluster = getProjectedServiceClusterEnvelope(
            service,
            canvasCenterX,
            canvasCenterY,
            rotX,
            rotY,
          )
          const clusterDx = midX - cluster.screenX
          const clusterDy = midY - cluster.screenY
          const clusterDistance = Math.hypot(clusterDx, clusterDy) || 1
          const clusterOffset = Math.min(
            cluster.radius * 0.42,
            clusterDistance * 0.32,
          )
          const clusterAnchorX =
            cluster.screenX + (clusterDx / clusterDistance) * clusterOffset
          const clusterAnchorY =
            cluster.screenY + (clusterDy / clusterDistance) * clusterOffset
          anchorX = lerp(midX, clusterAnchorX, 0.62)
          anchorY = lerp(midY, clusterAnchorY, 0.62)
          anchorWeight = 0.4
          bend *= 0.85
        }
      } else if (connection.kind === 'loadBalancer') {
        anchorY = lerp(midY, canvasCenterY - 36, 0.42)
        anchorWeight = 0.3
      }

      if (
        fromNode.replicaGroup &&
        fromNode.replicaGroup === toNode.replicaGroup
      ) {
        bend *= 0.45
      }

      return {
        x: lerp(midX, anchorX, anchorWeight) + normalX * bend * direction,
        y: lerp(midY, anchorY, anchorWeight) + normalY * bend * direction,
      }
    },
    [getAppServiceConfig],
  )

  const relayoutServicePods = useCallback(() => {
    APP_SERVICE_ORDER.forEach((serviceName) => {
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return
      }

      const serviceNodes = nodesRef.current.filter(
        (node) =>
          node.role === 'appPod' &&
          node.replicaGroup === serviceName &&
          node.lifecycleState !== 'terminating',
      )

      const activeNodes = serviceNodes
        .filter(
          (node) =>
            node.lifecycleState !== 'unhealthy' &&
            !(node.lifecycleState === 'draining' && node.scaleDownTarget),
        )
        .sort(
          (nodeA, nodeB) =>
            (nodeA.instanceNumber ?? 0) - (nodeB.instanceNumber ?? 0) ||
            nodeA.bornAt - nodeB.bornAt,
        )

      activeNodes.forEach((node, index) => {
        const placement = getServicePodPlacement(
          serviceName,
          index,
          activeNodes.length,
        )
        node.targetX = placement.x
        node.targetY = placement.y
        node.targetZ = placement.z
      })

      const exitingNodes = serviceNodes.filter(
        (node) => !activeNodes.some((activeNode) => activeNode.id === node.id),
      )
      const exitDirection = service.centerX >= 0 ? 1 : -1

      exitingNodes.forEach((node, index) => {
        node.targetX = service.centerX + exitDirection * (118 + index * 18)
        node.targetY = service.centerY - 26 + index * 18
        node.targetZ =
          service.centerZ + (index % 2 === 0 ? 22 : -22) + index * 8
      })
    })
  }, [getAppServiceConfig, getServicePodPlacement])

  const getTrafficSpikeReplicaTarget = useCallback(
    (serviceName: AppServiceGroup, severity: number) => {
      const baseline = clusterRef.current.baselineServiceReplicas[serviceName]
      const service = getAppServiceConfig(serviceName)

      if (!service) {
        return baseline
      }

      const spikeCeiling = Math.max(service.spikeReplicas, baseline)
      if (spikeCeiling <= baseline) {
        return baseline
      }

      const demandEnvelope = clamp(
        severity * (0.74 + service.trafficWeight * 0.68) + Math.random() * 0.22,
        0,
        1,
      )
      const spikeEnvelope = clamp(
        severity * (0.88 + service.trafficWeight * 0.42) + Math.random() * 0.16,
        0,
        1,
      )
      const burstHeadroom = Math.max(service.maxReplicas - spikeCeiling, 0)
      const burstEnvelope =
        burstHeadroom > 0
          ? clamp(
              Math.max(0, severity - 0.34) *
                (0.95 + service.trafficWeight * 0.9) +
                Math.random() * 0.14,
              0,
              1,
            )
          : 0
      const targetByDemand =
        baseline + Math.round((service.maxReplicas - baseline) * demandEnvelope)
      const targetBySpike = Math.round(
        baseline + (spikeCeiling - baseline) * spikeEnvelope,
      )
      const targetByBurst = Math.round(
        spikeCeiling + burstHeadroom * burstEnvelope,
      )
      const softHeadroom = Math.max(service.maxReplicas - baseline, 0)
      const reservedHeadroom =
        softHeadroom > 0
          ? Math.round(
              softHeadroom *
                clamp((1 - severity) * (0.08 + Math.random() * 0.12), 0, 0.2),
            )
          : 0
      const softCeiling = Math.max(
        baseline,
        service.maxReplicas - reservedHeadroom,
      )

      return clamp(
        Math.max(targetByDemand, targetBySpike, targetByBurst),
        baseline,
        softCeiling,
      )
    },
    [getAppServiceConfig],
  )

  const createReplacementPod = useCallback(
    (failedNode: ServiceNode) => {
      const serviceName =
        (failedNode.replicaGroup as AppServiceGroup | undefined) ?? 'edge'
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return
      }
      const nextNode = createAppPod(
        serviceName,
        service.centerX + randomInRange(-10, 10),
        service.centerY + randomInRange(-8, 8),
        service.centerZ + randomInRange(-10, 10),
        {
          lifecycleState: 'starting',
          acceptingTraffic: false,
          replacementLaunched: false,
          replacementFor: failedNode.label,
          statusSince: timeRef.current,
        },
      )

      nodesRef.current.push(nextNode)
      const replacementEventLevel =
        getEmergencyState() === 'emergency' ? 'error' : 'info'
      pushClusterEvent(
        replacementEventLevel,
        `deployment/${serviceName} created replacement ${nextNode.label} for ${failedNode.label}`,
      )
    },
    [createAppPod, getAppServiceConfig, getEmergencyState, pushClusterEvent],
  )

  const triggerPodFailure = useCallback(
    (reason: 'ambient' | 'emergency') => {
      const candidates = getReadyAppPods()
      if (candidates.length === 0) {
        return false
      }

      const visibleServices = new Set(getMostVisibleServiceGroups(3))
      const emergencyScenarioServices =
        reason === 'emergency'
          ? new Set(
              getScenarioAffectedServices(emergencyRef.current.scenarioKey),
            )
          : null
      const scenarioCandidates = emergencyScenarioServices
        ? candidates.filter((candidate) =>
            candidate.replicaGroup
              ? emergencyScenarioServices.has(
                  candidate.replicaGroup as AppServiceGroup,
                )
              : false,
          )
        : candidates
      const preferredCandidates = scenarioCandidates.filter((candidate) =>
        candidate.replicaGroup
          ? visibleServices.has(candidate.replicaGroup as AppServiceGroup)
          : false,
      )
      const selectionPool =
        preferredCandidates.length > 0
          ? preferredCandidates
          : scenarioCandidates.length > 0
            ? scenarioCandidates
            : candidates
      const pod = getRequiredArrayItem(
        selectionPool,
        Math.floor(Math.random() * selectionPool.length),
        'Expected a pod candidate to drain.',
      )
      pod.lifecycleState = 'draining'
      pod.acceptingTraffic = false
      pod.statusSince = timeRef.current
      pod.replacementLaunched = false

      const message =
        reason === 'emergency'
          ? `readiness probe failed on ${pod.label}; lb-ext removed target and rerouted traffic`
          : `cluster controller marked ${pod.label} unhealthy; draining traffic from lb-ext`

      pushClusterEvent(reason === 'emergency' ? 'error' : 'warn', message)
      emitClusterSnapshot(true)
      return true
    },
    [
      emitClusterSnapshot,
      getMostVisibleServiceGroups,
      getReadyAppPods,
      pushClusterEvent,
    ],
  )

  const createScaleUpPods = useCallback(
    (serviceName: AppServiceGroup, requestedCount: number) => {
      const service = getAppServiceConfig(serviceName)
      if (!service) {
        return 0
      }

      const count = Math.max(1, Math.floor(requestedCount))
      const createdLabels: string[] = []

      for (let index = 0; index < count; index += 1) {
        const node = createAppPod(
          serviceName,
          service.centerX + randomInRange(-12, 12),
          service.centerY + randomInRange(-10, 10),
          service.centerZ + randomInRange(-12, 12),
          {
            lifecycleState: 'starting',
            acceptingTraffic: false,
            replacementLaunched: false,
            statusSince: timeRef.current,
          },
        )

        nodesRef.current.push(node)
        createdLabels.push(node.label)
      }

      if (createdLabels.length === 0) {
        return 0
      }

      pushClusterEvent(
        'info',
        createdLabels.length === 1
          ? `autoscaler is adding ${createdLabels[0]} to ${serviceName} on the private network`
          : `autoscaler is adding ${createdLabels.length} pods to ${serviceName} on the private network`,
      )
      enqueueAutoscalerToast(
        'AUTOSCALER SCALE OUT',
        createdLabels.length === 1
          ? `adding ${createdLabels[0]} to ${serviceName}`
          : `adding ${createdLabels.length} pods to ${serviceName}`,
        'rgba(96, 165, 250, 0.9)',
      )
      return createdLabels.length
    },
    [
      createAppPod,
      enqueueAutoscalerToast,
      getAppServiceConfig,
      pushClusterEvent,
    ],
  )

  const requestScaleDownPods = useCallback(
    (serviceName: AppServiceGroup, requestedCount: number) => {
      const candidates = nodesRef.current
        .filter(
          (node) =>
            node.role === 'appPod' &&
            node.replicaGroup === serviceName &&
            node.lifecycleState === 'ready' &&
            node.acceptingTraffic,
        )
        .sort((nodeA, nodeB) => nodeB.bornAt - nodeA.bornAt)

      if (candidates.length === 0) {
        return 0
      }

      const count = Math.max(1, Math.floor(requestedCount))
      const drainingPods = candidates.slice(0, count)
      const firstDrainingPod = getRequiredArrayItem(
        drainingPods,
        0,
        'Expected at least one pod to drain.',
      )

      drainingPods.forEach((pod) => {
        pod.scaleDownTarget = true
        pod.acceptingTraffic = false
        pod.replacementLaunched = true
        delete pod.replacementFor
        pod.lifecycleState = 'draining'
        pod.statusSince = timeRef.current
      })

      pushClusterEvent(
        'warn',
        drainingPods.length === 1
          ? `autoscaler is draining surplus ${firstDrainingPod.label} from ${serviceName}`
          : `autoscaler is draining ${drainingPods.length} surplus pods from ${serviceName}`,
      )
      enqueueAutoscalerToast(
        'AUTOSCALER SCALE IN',
        drainingPods.length === 1
          ? `draining ${firstDrainingPod.label} from ${serviceName}`
          : `draining ${drainingPods.length} pods from ${serviceName}`,
        'rgba(251, 191, 36, 0.9)',
      )
      emitClusterSnapshot(true)
      return drainingPods.length
    },
    [emitClusterSnapshot, enqueueAutoscalerToast, pushClusterEvent],
  )

  const runAutoscaler = useCallback(() => {
    const cluster = clusterRef.current
    const scalingActivity = getScalingActivitySummary()
    const visibleServiceSet = new Set(getMostVisibleServiceGroups(3))
    if (
      timeRef.current < cluster.nextScaleActionTime ||
      nodesRef.current.some(
        (node) => node.role === 'appPod' && node.lifecycleState === 'unhealthy',
      )
    ) {
      return false
    }

    const serviceStates = APP_SERVICE_ORDER.map((serviceName) => {
      const service = getAppServiceConfig(serviceName)
      const currentReplicas = getServiceReplicaCount(serviceName)
      const desiredReplicas = cluster.desiredServiceReplicas[serviceName]
      const activity = scalingActivity.byService[serviceName]

      return {
        serviceName,
        currentReplicas,
        desiredReplicas,
        scaleOutGap: Math.max(desiredReplicas - currentReplicas, 0),
        scaleInGap: Math.max(currentReplicas - desiredReplicas, 0),
        starting: activity.starting,
        draining: activity.draining,
        trafficWeight: service?.trafficWeight ?? 0.5,
        maxReplicas: service?.maxReplicas ?? desiredReplicas,
        isVisible: visibleServiceSet.has(serviceName),
      }
    })
    const totalScaleOutGap = serviceStates.reduce(
      (sum, state) => sum + state.scaleOutGap,
      0,
    )
    const totalScaleInGap = serviceStates.reduce(
      (sum, state) => sum + state.scaleInGap,
      0,
    )

    const maxConcurrentStartingPods = cluster.isTrafficSpike
      ? Math.min(
          24,
          8 +
            Math.round(cluster.trafficSpikeSeverity * 7) +
            Math.ceil(totalScaleOutGap / 6),
        )
      : Math.min(12, 4 + Math.ceil(totalScaleOutGap / 7))
    const maxConcurrentDrainingPods = cluster.isTrafficSpike
      ? Math.min(10, 3 + Math.ceil(totalScaleInGap / 10))
      : Math.min(14, 5 + Math.ceil(totalScaleInGap / 8))

    let remainingStartSlots = Math.max(
      0,
      maxConcurrentStartingPods - scalingActivity.starting,
    )
    let remainingDrainSlots = Math.max(
      0,
      maxConcurrentDrainingPods - scalingActivity.draining,
    )
    let remainingScaleOutBudget =
      totalScaleOutGap > 0
        ? cluster.isTrafficSpike
          ? Math.min(
              remainingStartSlots,
              3 +
                Math.round(cluster.trafficSpikeSeverity * 3) +
                Math.ceil(totalScaleOutGap / 12),
            )
          : Math.min(remainingStartSlots, 1 + Math.ceil(totalScaleOutGap / 9))
        : 0
    let remainingScaleInBudget =
      totalScaleInGap > 0
        ? cluster.isTrafficSpike
          ? Math.min(remainingDrainSlots, 1 + Math.ceil(totalScaleInGap / 16))
          : Math.min(remainingDrainSlots, 1 + Math.ceil(totalScaleInGap / 10))
        : 0

    let scaledOutPods = 0
    let scaledInPods = 0

    while (remainingStartSlots > 0 && remainingScaleOutBudget > 0) {
      const candidate = [...serviceStates]
        .filter((state) => state.scaleOutGap > 0)
        .sort((left, right) => {
          if (left.scaleOutGap !== right.scaleOutGap) {
            return right.scaleOutGap - left.scaleOutGap
          }

          if (left.isVisible !== right.isVisible) {
            return left.isVisible ? -1 : 1
          }

          if (left.trafficWeight !== right.trafficWeight) {
            return right.trafficWeight - left.trafficWeight
          }

          return (
            APP_SERVICE_ORDER.indexOf(left.serviceName) -
            APP_SERVICE_ORDER.indexOf(right.serviceName)
          )
        })[0]

      if (!candidate) {
        break
      }

      const perServiceStartingCap = cluster.isTrafficSpike
        ? Math.min(
            Math.max(3, Math.ceil(candidate.maxReplicas * 0.34)),
            4 +
              Math.ceil(candidate.scaleOutGap / 5) +
              Math.round(candidate.trafficWeight * 2),
          )
        : Math.min(
            4,
            1 +
              Math.ceil(candidate.scaleOutGap / 6) +
              Math.round(candidate.trafficWeight),
          )
      const serviceStartHeadroom = Math.max(
        0,
        perServiceStartingCap - candidate.starting,
      )

      if (serviceStartHeadroom === 0) {
        candidate.scaleOutGap = 0
        continue
      }

      const batchCount = Math.min(
        candidate.scaleOutGap,
        serviceStartHeadroom,
        remainingStartSlots,
        remainingScaleOutBudget,
        cluster.isTrafficSpike
          ? Math.max(2, Math.ceil(candidate.scaleOutGap / 8))
          : 2,
      )
      const created = createScaleUpPods(candidate.serviceName, batchCount)

      if (created === 0) {
        candidate.scaleOutGap = 0
        continue
      }

      candidate.currentReplicas += created
      candidate.starting += created
      candidate.scaleOutGap = Math.max(
        candidate.desiredReplicas - candidate.currentReplicas,
        0,
      )
      remainingStartSlots -= created
      remainingScaleOutBudget -= created
      scaledOutPods += created
    }

    while (remainingDrainSlots > 0 && remainingScaleInBudget > 0) {
      const candidate = [...serviceStates]
        .filter((state) => state.scaleInGap > 0 && state.starting === 0)
        .sort((left, right) => {
          if (left.scaleInGap !== right.scaleInGap) {
            return right.scaleInGap - left.scaleInGap
          }

          if (left.isVisible !== right.isVisible) {
            return left.isVisible ? -1 : 1
          }

          if (left.trafficWeight !== right.trafficWeight) {
            return left.trafficWeight - right.trafficWeight
          }

          return (
            APP_SERVICE_ORDER.indexOf(left.serviceName) -
            APP_SERVICE_ORDER.indexOf(right.serviceName)
          )
        })[0]

      if (!candidate) {
        break
      }

      const perServiceDrainingCap = cluster.isTrafficSpike
        ? 2
        : Math.min(4, 1 + Math.ceil(candidate.scaleInGap / 5))
      const serviceDrainHeadroom = Math.max(
        0,
        perServiceDrainingCap - candidate.draining,
      )

      if (serviceDrainHeadroom === 0) {
        candidate.scaleInGap = 0
        continue
      }

      const batchCount = Math.min(
        candidate.scaleInGap,
        serviceDrainHeadroom,
        remainingDrainSlots,
        remainingScaleInBudget,
        cluster.isTrafficSpike ? 1 : 2,
      )
      const drained = requestScaleDownPods(candidate.serviceName, batchCount)

      if (drained === 0) {
        candidate.scaleInGap = 0
        continue
      }

      candidate.currentReplicas -= drained
      candidate.draining += drained
      candidate.scaleInGap = Math.max(
        candidate.currentReplicas - candidate.desiredReplicas,
        0,
      )
      remainingDrainSlots -= drained
      remainingScaleInBudget -= drained
      scaledInPods += drained
    }

    if (scaledOutPods > 0) {
      cluster.nextScaleActionTime = cluster.isTrafficSpike
        ? timeRef.current + 0.12 + Math.random() * 0.14
        : timeRef.current + 0.22 + Math.random() * 0.16
      return true
    }

    if (scaledInPods > 0) {
      cluster.nextScaleActionTime = cluster.isTrafficSpike
        ? timeRef.current + 0.28 + Math.random() * 0.18
        : timeRef.current + 0.24 + Math.random() * 0.18
      return true
    }

    return false
  }, [
    createScaleUpPods,
    getAppServiceConfig,
    getMostVisibleServiceGroups,
    getServiceReplicaCount,
    getScalingActivitySummary,
    requestScaleDownPods,
  ])

  const relaxReplicaTargetsTowardsBaseline = useCallback(() => {
    const cluster = clusterRef.current

    if (
      cluster.isTrafficSpike ||
      timeRef.current < cluster.nextScaleCooldownTime
    ) {
      return false
    }

    const visibleServices = new Set(getMostVisibleServiceGroups(3))
    const candidates = APP_SERVICE_ORDER.map((serviceName) => {
      const baseline = cluster.baselineServiceReplicas[serviceName]
      const desired = cluster.desiredServiceReplicas[serviceName]
      return {
        serviceName,
        baseline,
        desired,
        excess: desired - baseline,
        currentReplicas: getServiceReplicaCount(serviceName),
        isVisible: visibleServices.has(serviceName),
      }
    })
      .filter((candidate) => candidate.excess > 0)
      .sort((candidateA, candidateB) => {
        if (candidateA.isVisible !== candidateB.isVisible) {
          return candidateA.isVisible ? -1 : 1
        }

        if (candidateA.excess !== candidateB.excess) {
          return candidateB.excess - candidateA.excess
        }

        return candidateB.currentReplicas - candidateA.currentReplicas
      })

    if (candidates.length === 0) {
      return false
    }

    const totalExcess = candidates.reduce(
      (sum, candidate) => sum + candidate.excess,
      0,
    )
    const trimCount = Math.min(4, 1 + Math.floor(totalExcess / 10))
    let changed = false

    candidates.slice(0, trimCount).forEach((candidate) => {
      const reductionStep = Math.min(3, 1 + Math.floor(candidate.excess / 8))
      const nextDesired = Math.max(
        candidate.baseline,
        candidate.desired - reductionStep,
      )
      if (nextDesired !== candidate.desired) {
        cluster.desiredServiceReplicas[candidate.serviceName] = nextDesired
        changed = true
      }
    })

    if (!changed) {
      return false
    }

    cluster.desiredReplicas = Object.values(
      cluster.desiredServiceReplicas,
    ).reduce((sum, count) => sum + count, 0)
    cluster.nextScaleCooldownTime = timeRef.current + 0.55 + Math.random() * 0.7
    cluster.nextScaleActionTime = Math.max(
      cluster.nextScaleActionTime,
      timeRef.current + 0.14,
    )

    return true
  }, [getMostVisibleServiceGroups, getServiceReplicaCount])

  const rebalanceAmbientReplicaTargets = useCallback(() => {
    const cluster = clusterRef.current

    if (
      cluster.isTrafficSpike ||
      timeRef.current < cluster.nextAmbientRebalanceTime
    ) {
      return false
    }

    const scalingActivity = getScalingActivitySummary()
    if (scalingActivity.starting > 0 || scalingActivity.draining > 0) {
      cluster.nextAmbientRebalanceTime =
        timeRef.current + 1.6 + Math.random() * 1.4
      return false
    }

    const visibleServiceSet = new Set(getMostVisibleServiceGroups(3))
    const serviceStates = APP_SERVICE_ORDER.map((serviceName) => {
      const service = getAppServiceConfig(serviceName)
      const baseline = cluster.baselineServiceReplicas[serviceName]
      const desired = cluster.desiredServiceReplicas[serviceName]
      const currentReplicas = getServiceReplicaCount(serviceName)
      const minDesired = Math.max(service?.minReplicas ?? 1, baseline - 1)
      const maxDesired = Math.min(service?.maxReplicas ?? desired, baseline + 1)

      return {
        serviceName,
        desired,
        currentReplicas,
        trafficWeight: service?.trafficWeight ?? 0.5,
        isVisible: visibleServiceSet.has(serviceName),
        donorHeadroom: Math.max(desired - minDesired, 0),
        receiverHeadroom: Math.max(maxDesired - desired, 0),
      }
    })

    const donor = [...serviceStates]
      .filter((state) => state.donorHeadroom > 0)
      .sort((left, right) => {
        if (left.isVisible !== right.isVisible) {
          return left.isVisible ? 1 : -1
        }

        if (left.trafficWeight !== right.trafficWeight) {
          return left.trafficWeight - right.trafficWeight
        }

        if (left.currentReplicas !== right.currentReplicas) {
          return right.currentReplicas - left.currentReplicas
        }

        return (
          APP_SERVICE_ORDER.indexOf(left.serviceName) -
          APP_SERVICE_ORDER.indexOf(right.serviceName)
        )
      })[0]

    const receiver = [...serviceStates]
      .filter(
        (state) =>
          state.receiverHeadroom > 0 &&
          state.serviceName !== donor?.serviceName,
      )
      .sort((left, right) => {
        if (left.isVisible !== right.isVisible) {
          return left.isVisible ? -1 : 1
        }

        if (left.trafficWeight !== right.trafficWeight) {
          return right.trafficWeight - left.trafficWeight
        }

        if (left.currentReplicas !== right.currentReplicas) {
          return left.currentReplicas - right.currentReplicas
        }

        return (
          APP_SERVICE_ORDER.indexOf(left.serviceName) -
          APP_SERVICE_ORDER.indexOf(right.serviceName)
        )
      })[0]

    if (!donor || !receiver) {
      cluster.nextAmbientRebalanceTime = timeRef.current + 2.8 + Math.random()
      return false
    }

    cluster.desiredServiceReplicas[donor.serviceName] -= 1
    cluster.desiredServiceReplicas[receiver.serviceName] += 1
    cluster.desiredReplicas = Object.values(
      cluster.desiredServiceReplicas,
    ).reduce((sum, count) => sum + count, 0)
    cluster.nextAmbientRebalanceTime = timeRef.current + 4.4 + Math.random() * 3
    cluster.nextScaleActionTime = Math.min(
      cluster.nextScaleActionTime,
      timeRef.current + 0.12,
    )

    pushClusterEvent(
      'info',
      `autoscaler is rebalancing standby capacity from ${donor.serviceName} to ${receiver.serviceName}`,
    )
    emitClusterSnapshot(true)
    return true
  }, [
    emitClusterSnapshot,
    getAppServiceConfig,
    getMostVisibleServiceGroups,
    getScalingActivitySummary,
    getServiceReplicaCount,
    pushClusterEvent,
  ])

  const rebalanceTrafficSpikeTargets = useCallback(
    (force = false) => {
      const cluster = clusterRef.current

      if (!cluster.isTrafficSpike) {
        return false
      }

      if (!force && timeRef.current < cluster.nextTrafficTargetRefreshTime) {
        return false
      }

      const severityDrift = randomInRange(-0.08, 0.12)
      cluster.trafficSpikeSeverity = clamp(
        cluster.trafficSpikeSeverity + severityDrift,
        0.42,
        1,
      )

      let changed = false

      APP_SERVICE_ORDER.forEach((serviceName) => {
        const service = getAppServiceConfig(serviceName)
        if (!service) {
          return
        }

        const baseline = cluster.baselineServiceReplicas[serviceName]
        const currentDesired = cluster.desiredServiceReplicas[serviceName]
        const currentReplicas = getServiceReplicaCount(serviceName)
        const effectiveSeverity = clamp(
          cluster.trafficSpikeSeverity +
            randomInRange(-0.1, 0.12) +
            (Math.max(0, currentDesired - currentReplicas) /
              Math.max(service.maxReplicas, 1)) *
              0.18,
          0.32,
          1,
        )
        const rawTarget = getTrafficSpikeReplicaTarget(
          serviceName,
          effectiveSeverity,
        )
        const targetDelta = rawTarget - currentDesired
        if (
          Math.abs(targetDelta) <
          Math.max(2, Math.round(service.maxReplicas * 0.05))
        ) {
          return
        }
        const nextDesired =
          targetDelta > 0
            ? Math.min(
                rawTarget,
                currentDesired +
                  Math.max(
                    2,
                    Math.ceil(
                      (service.maxReplicas - service.minReplicas) *
                        (0.03 + cluster.trafficSpikeSeverity * 0.05),
                    ),
                  ),
              )
            : Math.max(
                baseline,
                currentDesired -
                  Math.max(
                    1,
                    Math.ceil(
                      (service.maxReplicas - service.minReplicas) *
                        (0.02 + (1 - cluster.trafficSpikeSeverity) * 0.04),
                    ),
                  ),
              )

        if (nextDesired !== currentDesired) {
          cluster.desiredServiceReplicas[serviceName] = nextDesired
          changed = true
        }
      })

      if (changed) {
        cluster.desiredReplicas = Object.values(
          cluster.desiredServiceReplicas,
        ).reduce((sum, count) => sum + count, 0)
        cluster.nextScaleActionTime = Math.min(
          cluster.nextScaleActionTime,
          timeRef.current + 0.08,
        )
      }

      cluster.nextTrafficTargetRefreshTime =
        timeRef.current +
        (1.8 + (1 - cluster.trafficSpikeSeverity) * 1.6) +
        Math.random() * 0.75

      return changed
    },
    [getAppServiceConfig, getServiceReplicaCount, getTrafficSpikeReplicaTarget],
  )

  const startEmergency = useCallback(
    (
      scenarioKey?: EmergencyScenarioKey,
      triggerSource: TriggerSource = null,
    ) => {
      const emergency = emergencyRef.current
      if (emergency.isActive || emergency.isRecovery) {
        return
      }

      const nextScenarioKey = scenarioKey ?? pickRandomEmergencyScenario()
      const scenario = getEmergencyScenario(nextScenarioKey)
      const affectedServiceNames = new Set(
        getScenarioAffectedServices(nextScenarioKey),
      )
      const affectedServices = getScenarioAffectedServices(nextScenarioKey)
      const readyAffectedPods = getReadyAppPods().filter((node) =>
        node.replicaGroup
          ? affectedServiceNames.has(node.replicaGroup as AppServiceGroup)
          : false,
      )
      emergency.isActive = true
      emergency.scenarioKey = nextScenarioKey
      emergency.triggerSource = triggerSource
      emergency.startTime = timeRef.current
      emergency.hasTriggeredFirstEmergency = true
      emergency.nextFailureTime = timeRef.current + 0.4
      emergency.triggeredFailures = 0
      emergency.failureTarget = Math.min(
        scenario.failureTarget,
        Math.max(1, readyAffectedPods.length),
      )
      emergency.recoveryAnnounced = false
      pushClusterEvent('error', scenario.eventMessage)
      getEmergencyLogBurst(nextScenarioKey, affectedServices).forEach(
        ({ level, message }) => {
          pushClusterEvent(level, message)
        },
      )
      enqueueEventToast({
        title: scenario.title,
        subtitle: scenario.subtitle,
        mode: 'emergency',
        accentColor: 'rgba(248, 113, 113, 0.92)',
        duration: 4.8,
      })
      window.dispatchEvent(
        new CustomEvent('network-emergency', { detail: { type: 'start' } }),
      )
      emitClusterSnapshot(true)
    },
    [emitClusterSnapshot, enqueueEventToast, getReadyAppPods, pushClusterEvent],
  )

  const initNodes = useCallback(
    (width: number, height: number) => {
      nodeIdRef.current = 0
      connectionIdRef.current = 0
      packetIdRef.current = 0
      statusIdRef.current = 0
      serviceInstanceCounterRef.current = {
        edge: 0,
        auth: 0,
        catalog: 0,
        basket: 0,
        checkout: 0,
        warehouse: 0,
      }
      APP_SERVICE_ORDER.forEach((serviceName, index) => {
        serviceClusterMotionRef.current[serviceName] = {
          energy: 0,
          footprintCount: 0,
          degradedCount: 0,
          desiredCount: 0,
          pendingScaleOutSteps: 0,
          pendingScaleInSteps: 0,
          scaleRingProgress: 0,
          scaleRingDirection: 0,
          phase: index * 0.82,
        }
      })

      clusterRef.current.desiredReplicas = 6
      clusterRef.current.nextAmbientFailureTime = 8 + Math.random() * 6
      clusterRef.current.nextAmbientRebalanceTime = 3.5 + Math.random() * 3.5
      clusterRef.current.nextTrafficSpikeTime = 5 + Math.random() * 6
      clusterRef.current.trafficSpikeEndTime = 0
      clusterRef.current.isTrafficSpike = false
      clusterRef.current.trafficSpikeLevel = 0
      clusterRef.current.trafficSpikeSeverity = 0
      clusterRef.current.nextTrafficTargetRefreshTime = 0
      clusterRef.current.nextScaleActionTime = 0
      clusterRef.current.nextScaleCooldownTime = 0
      const rightWidgetGutter = clamp(width * 0.16, 220, 300)
      const leftContentGutter = clamp(width * 0.12, 110, 180)
      const topPreviewGutter = clamp(height * 0.18, 120, 190)
      const bottomContentGutter = clamp(height * 0.14, 110, 170)
      const leftBound = -width / 2 + leftContentGutter
      const rightBound = width / 2 - rightWidgetGutter
      const topBound = -height / 2 + topPreviewGutter
      const bottomBound = height / 2 - bottomContentGutter
      const infraDepth = clamp(width * 0.15, 140, 220)
      const serviceTopologyConfigs = [
        {
          name: 'edge',
          displayLabel: 'edge service',
          labelPrefix: 'edge',
          color: 'sky',
          minReplicas: 1,
          baselineReplicas: [3, 7],
          spikeReplicas: 12,
          maxReplicas: 18,
          trafficWeight: 1,
          layoutSeed: { x: 0.84, y: 0.44, z: 0.96 },
          downstream: ['auth', 'catalog', 'basket', 'checkout'],
        },
        {
          name: 'auth',
          displayLabel: 'auth service',
          labelPrefix: 'auth',
          color: 'emerald',
          minReplicas: 1,
          baselineReplicas: [2, 5],
          spikeReplicas: 7,
          maxReplicas: 12,
          trafficWeight: 0.56,
          layoutSeed: { x: 0.62, y: 0.18, z: 0.34 },
          downstream: [],
        },
        {
          name: 'catalog',
          displayLabel: 'catalog service',
          labelPrefix: 'catalog',
          color: 'amber',
          minReplicas: 1,
          baselineReplicas: [3, 6],
          spikeReplicas: 10,
          maxReplicas: 18,
          trafficWeight: 0.68,
          layoutSeed: { x: 0.56, y: 0.78, z: -0.44 },
          downstream: ['warehouse'],
        },
        {
          name: 'basket',
          displayLabel: 'basket service',
          labelPrefix: 'basket',
          color: 'rose',
          minReplicas: 1,
          baselineReplicas: [3, 8],
          spikeReplicas: 14,
          maxReplicas: 24,
          trafficWeight: 0.84,
          layoutSeed: { x: 0.42, y: 0.56, z: 0.58 },
          downstream: [],
        },
        {
          name: 'checkout',
          displayLabel: 'checkout service',
          labelPrefix: 'checkout',
          color: 'violet',
          minReplicas: 1,
          baselineReplicas: [5, 10],
          spikeReplicas: 22,
          maxReplicas: 50,
          trafficWeight: 1.18,
          layoutSeed: { x: 0.2, y: 0.32, z: 1.08 },
          downstream: ['auth', 'basket', 'warehouse'],
        },
        {
          name: 'warehouse',
          displayLabel: 'warehouse service',
          labelPrefix: 'warehouse',
          color: 'teal',
          minReplicas: 1,
          baselineReplicas: [2, 6],
          spikeReplicas: 9,
          maxReplicas: 16,
          trafficWeight: 0.62,
          layoutSeed: { x: 0.2, y: 0.74, z: -0.86 },
          downstream: [],
        },
      ] satisfies Array<
        Omit<AppServiceConfig, 'centerX' | 'centerY' | 'centerZ'>
      >
      const reservedZones: OccupiedLayoutZone[] = [
        {
          x: lerp(leftBound, rightBound, 0.9),
          y: lerp(topBound, bottomBound, 0.5),
          radius: 86,
        },
        {
          x: lerp(leftBound, rightBound, 0.46),
          y: lerp(topBound, bottomBound, 0.92),
          radius: 92,
        },
        {
          x: lerp(leftBound, rightBound, 0.16),
          y: lerp(topBound, bottomBound, 0.86),
          radius: 96,
        },
        {
          x: lerp(leftBound, rightBound, 0.08),
          y: lerp(topBound, bottomBound, 0.7),
          radius: 74,
        },
        {
          x: lerp(leftBound, rightBound, 0.94),
          y: lerp(topBound, bottomBound, 0.98),
          radius: 62,
        },
        {
          x: lerp(leftBound, rightBound, 0.06),
          y: lerp(topBound, bottomBound, 0.98),
          radius: 62,
        },
        {
          x: lerp(leftBound, rightBound, 0.34),
          y: lerp(topBound, bottomBound, 0.46),
          radius: 78,
        },
        {
          x: lerp(leftBound, rightBound, 0.31),
          y: lerp(topBound, bottomBound, 0.68),
          radius: 88,
        },
      ]
      const serviceCenters = resolveServiceClusterCenters(
        serviceTopologyConfigs,
        {
          left: leftBound,
          right: rightBound,
          top: topBound,
          bottom: bottomBound,
          infraDepth,
        },
        reservedZones,
      )
      const serviceConfigs: AppServiceConfig[] = serviceTopologyConfigs.map(
        (service) => {
          const center = serviceCenters.get(service.name)

          return {
            ...service,
            centerX:
              center?.x ?? lerp(leftBound, rightBound, service.layoutSeed.x),
            centerY:
              center?.y ?? lerp(topBound, bottomBound, service.layoutSeed.y),
            centerZ: center?.z ?? service.layoutSeed.z * infraDepth,
          }
        },
      )
      appServicesRef.current = serviceConfigs
      clusterRef.current.baselineServiceReplicas = serviceConfigs.reduce(
        (accumulator, service) => {
          const [baselineMin, baselineMax] = service.baselineReplicas
          accumulator[service.name] = clamp(
            baselineMin +
              Math.floor(Math.random() * (baselineMax - baselineMin + 1)),
            service.minReplicas,
            service.maxReplicas,
          )
          return accumulator
        },
        {
          edge: 1,
          auth: 1,
          catalog: 1,
          basket: 1,
          checkout: 1,
          warehouse: 1,
        } as Record<AppServiceGroup, number>,
      )
      clusterRef.current.desiredServiceReplicas = {
        ...clusterRef.current.baselineServiceReplicas,
      }
      clusterRef.current.desiredReplicas = Object.values(
        clusterRef.current.desiredServiceReplicas,
      ).reduce((sum, count) => sum + count, 0)
      APP_SERVICE_ORDER.forEach((serviceName) => {
        serviceClusterMotionRef.current[serviceName].desiredCount =
          clusterRef.current.desiredServiceReplicas[serviceName]
      })

      const nodes: ServiceNode[] = [
        createNode(
          'ingress',
          'ingress',
          lerp(leftBound, rightBound, 0.95),
          lerp(topBound, bottomBound, 0.42),
          infraDepth * 1.72,
          {
            replicaGroup: 'edge',
          },
        ),
        createNode(
          'loadBalancer',
          'lb-ext',
          lerp(leftBound, rightBound, 0.87),
          lerp(topBound, bottomBound, 0.54),
          infraDepth * 1.16,
          {
            replicaGroup: 'edge',
          },
        ),
        createNode(
          'cache',
          'redis-m',
          lerp(leftBound, rightBound, 0.48),
          lerp(topBound, bottomBound, 0.84),
          infraDepth * 0.2,
        ),
        createNode(
          'cache',
          'redis-r1',
          lerp(leftBound, rightBound, 0.4),
          lerp(topBound, bottomBound, 0.94),
          -infraDepth * 0.56,
        ),
        createNode(
          'cache',
          'redis-r2',
          lerp(leftBound, rightBound, 0.58),
          lerp(topBound, bottomBound, 0.9),
          -infraDepth * 0.86,
        ),
        createNode(
          'queue',
          'queue',
          lerp(leftBound, rightBound, 0.23),
          lerp(topBound, bottomBound, 0.72),
          infraDepth * 0.18,
        ),
        createNode(
          'queue',
          'queue-priority',
          lerp(leftBound, rightBound, 0.35),
          lerp(topBound, bottomBound, 0.48),
          infraDepth * 0.42,
        ),
        createNode(
          'queue',
          'queue-dlq',
          lerp(leftBound, rightBound, 0.32),
          lerp(topBound, bottomBound, 0.69),
          -infraDepth * 0.18,
        ),
        createNode(
          'database',
          'pg-primary',
          lerp(leftBound, rightBound, 0.1),
          lerp(topBound, bottomBound, 0.86),
          -infraDepth * 1.35,
        ),
        createNode(
          'database',
          'pg-replica',
          lerp(leftBound, rightBound, 0.24),
          lerp(topBound, bottomBound, 0.96),
          -infraDepth * 1.58,
        ),
        createNode(
          'database',
          'pg-standby',
          lerp(leftBound, rightBound, 0.36),
          lerp(topBound, bottomBound, 0.84),
          -infraDepth * 0.92,
        ),
        createNode(
          'worker',
          'worker-a',
          lerp(leftBound, rightBound, 0.05),
          lerp(topBound, bottomBound, 0.74),
          infraDepth * 0.78,
        ),
        createNode(
          'worker',
          'worker-b',
          lerp(leftBound, rightBound, 0.15),
          lerp(topBound, bottomBound, 0.6),
          infraDepth * 0.36,
        ),
        createNode(
          'observability',
          'metrics',
          lerp(leftBound, rightBound, 0.9),
          lerp(topBound, bottomBound, 0.92),
          -infraDepth * 1.04,
        ),
        createNode(
          'observability',
          'logs',
          lerp(leftBound, rightBound, 0.06),
          lerp(topBound, bottomBound, 0.94),
          -infraDepth * 1.12,
        ),
      ]

      serviceConfigs.forEach((service) => {
        const initialReplicaCount =
          clusterRef.current.baselineServiceReplicas[service.name] ??
          service.minReplicas

        for (let index = 0; index < initialReplicaCount; index += 1) {
          const placement = getServicePodPlacement(
            service.name,
            index,
            initialReplicaCount,
          )

          nodes.push(
            createAppPod(service.name, placement.x, placement.y, placement.z),
          )
        }
      })

      return nodes
    },
    [createAppPod, createNode, getServicePodPlacement],
  )

  const syncConnections = useCallback(() => {
    const nodes = nodesRef.current
    const ingress = nodes.find((node) => node.role === 'ingress')
    const loadBalancer = nodes.find((node) => node.role === 'loadBalancer')
    const caches = nodes.filter((node) => node.role === 'cache')
    const redisMaster =
      caches.find((node) => node.label === 'redis-m') ?? caches[0]
    const redisReplicas = caches.filter((node) => node.id !== redisMaster?.id)
    const queues = nodes.filter((node) => node.role === 'queue')
    const databases = nodes.filter((node) => node.role === 'database')
    const primaryQueue =
      queues.find((node) => node.label === 'queue') ?? queues[0]
    const priorityQueue =
      queues.find((node) => node.label === 'queue-priority') ??
      queues[1] ??
      primaryQueue
    const deadLetterQueue =
      queues.find((node) => node.label === 'queue-dlq') ??
      queues[2] ??
      priorityQueue ??
      primaryQueue
    const primaryDb =
      databases.find((node) => node.label === 'pg-primary') ?? databases[0]
    const replicaDb =
      databases.find((node) => node.label === 'pg-replica') ??
      databases[1] ??
      primaryDb
    const standbyDb =
      databases.find((node) => node.label === 'pg-standby') ??
      databases[2] ??
      replicaDb ??
      primaryDb
    const workers = nodes.filter((node) => node.role === 'worker')
    const observability = nodes.filter((node) => node.role === 'observability')
    const metricsNode = observability.find((node) => node.label === 'metrics')
    const logsNode = observability.find((node) => node.label === 'logs')
    const connectedAppPods = nodes.filter(
      (node) =>
        node.role === 'appPod' &&
        node.lifecycleState !== 'terminating' &&
        node.lifecycleState !== 'starting',
    )
    const podsByService = APP_SERVICE_ORDER.reduce(
      (accumulator, serviceName) => {
        accumulator[serviceName] = connectedAppPods.filter(
          (node) => node.replicaGroup === serviceName,
        )
        return accumulator
      },
      {
        edge: [],
        auth: [],
        catalog: [],
        basket: [],
        checkout: [],
        warehouse: [],
      } as Record<AppServiceGroup, ServiceNode[]>,
    )

    const desiredConnections: Array<{
      fromNodeId: number
      toNodeId: number
      kind: ConnectionKind
    }> = []

    if (ingress && loadBalancer) {
      desiredConnections.push({
        fromNodeId: ingress.id,
        toNodeId: loadBalancer.id,
        kind: 'ingress',
      })
    }

    podsByService.edge.forEach((pod, index) => {
      if (loadBalancer) {
        desiredConnections.push({
          fromNodeId: loadBalancer.id,
          toNodeId: pod.id,
          kind: 'loadBalancer',
        })
      }

      appServicesRef.current
        .find((service) => service.name === 'edge')
        ?.downstream.forEach((downstreamService) => {
          const downstreamPods = podsByService[downstreamService]
          const targetPod =
            downstreamPods[index % Math.max(downstreamPods.length, 1)]

          if (targetPod) {
            desiredConnections.push({
              fromNodeId: pod.id,
              toNodeId: targetPod.id,
              kind: 'service',
            })
          }
        })
    })

    connectedAppPods.forEach((pod, index) => {
      const queue =
        pod.replicaGroup === 'checkout'
          ? ([primaryQueue, priorityQueue, deadLetterQueue][
              index % Math.max(queues.length, 1)
            ] ?? primaryQueue)
          : pod.replicaGroup === 'warehouse'
            ? (priorityQueue ?? primaryQueue)
            : primaryQueue
      const worker = workers[index % Math.max(workers.length, 1)]
      const telemetry = observability[index % Math.max(observability.length, 1)]
      const authTarget =
        podsByService.auth[index % Math.max(podsByService.auth.length, 1)]
      const catalogTarget =
        podsByService.catalog[index % Math.max(podsByService.catalog.length, 1)]
      const basketTarget =
        podsByService.basket[index % Math.max(podsByService.basket.length, 1)]
      const warehouseTarget =
        podsByService.warehouse[
          index % Math.max(podsByService.warehouse.length, 1)
        ]

      if (pod.replicaGroup === 'auth') {
        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'catalog') {
        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (replicaDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: replicaDb.id,
            kind: 'storage',
          })
        }

        if (warehouseTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: warehouseTarget.id,
            kind: 'service',
          })
        }
      }

      if (pod.replicaGroup === 'basket') {
        if (authTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: authTarget.id,
            kind: 'service',
          })
        }

        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'checkout') {
        if (authTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: authTarget.id,
            kind: 'service',
          })
        }

        if (catalogTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: catalogTarget.id,
            kind: 'service',
          })
        }

        if (basketTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: basketTarget.id,
            kind: 'service',
          })
        }

        if (warehouseTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: warehouseTarget.id,
            kind: 'service',
          })
        }

        if (queue) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: queue.id,
            kind: 'service',
          })
        }

        if (redisMaster) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: redisMaster.id,
            kind: 'service',
          })
        }

        if (primaryDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: primaryDb.id,
            kind: 'storage',
          })
        }

        if (standbyDb && standbyDb.id !== primaryDb?.id) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: standbyDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'warehouse') {
        if (catalogTarget) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: catalogTarget.id,
            kind: 'service',
          })
        }

        if (queue) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: queue.id,
            kind: 'service',
          })
        }

        if (replicaDb) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: replicaDb.id,
            kind: 'storage',
          })
        }

        if (standbyDb && standbyDb.id !== replicaDb?.id) {
          desiredConnections.push({
            fromNodeId: pod.id,
            toNodeId: standbyDb.id,
            kind: 'storage',
          })
        }
      }

      if (pod.replicaGroup === 'edge' && worker) {
        desiredConnections.push({
          fromNodeId: worker.id,
          toNodeId: pod.id,
          kind: 'service',
        })
      }

      if (telemetry) {
        desiredConnections.push({
          fromNodeId: telemetry.id,
          toNodeId: pod.id,
          kind: 'telemetry',
        })
      }
    })

    APP_SERVICE_ORDER.forEach((serviceName) => {
      const servicePods = podsByService[serviceName]

      if (servicePods.length > 1) {
        servicePods.forEach((pod, index) => {
          const peerPod = servicePods[(index + 1) % servicePods.length]
          if (peerPod && peerPod.id !== pod.id) {
            desiredConnections.push({
              fromNodeId: pod.id,
              toNodeId: peerPod.id,
              kind: 'service',
            })
          }
        })
      }
    })

    if (primaryQueue && redisMaster) {
      desiredConnections.push({
        fromNodeId: primaryQueue.id,
        toNodeId: redisMaster.id,
        kind: 'service',
      })
    }

    if (redisMaster) {
      redisReplicas.forEach((replica, index) => {
        desiredConnections.push({
          fromNodeId: redisMaster.id,
          toNodeId: replica.id,
          kind: 'storage',
        })

        const peerReplica =
          redisReplicas[(index + 1) % Math.max(redisReplicas.length, 1)]
        if (peerReplica && peerReplica.id !== replica.id) {
          desiredConnections.push({
            fromNodeId: replica.id,
            toNodeId: peerReplica.id,
            kind: 'telemetry',
          })
        }
      })
    }

    if (metricsNode && ingress) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: ingress.id,
        kind: 'telemetry',
      })
    }

    if (metricsNode && loadBalancer) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: loadBalancer.id,
        kind: 'telemetry',
      })
    }

    if (logsNode && loadBalancer) {
      desiredConnections.push({
        fromNodeId: logsNode.id,
        toNodeId: loadBalancer.id,
        kind: 'telemetry',
      })
    }

    if (metricsNode && primaryQueue) {
      desiredConnections.push({
        fromNodeId: metricsNode.id,
        toNodeId: primaryQueue.id,
        kind: 'telemetry',
      })
    }

    if (logsNode && primaryQueue) {
      desiredConnections.push({
        fromNodeId: logsNode.id,
        toNodeId: primaryQueue.id,
        kind: 'telemetry',
      })
    }

    caches.forEach((cacheNode) => {
      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: cacheNode.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: cacheNode.id,
          kind: 'telemetry',
        })
      }
    })

    if (redisMaster && primaryQueue) {
      desiredConnections.push({
        fromNodeId: redisMaster.id,
        toNodeId: primaryQueue.id,
        kind: 'service',
      })
    }

    if (primaryQueue && priorityQueue && primaryQueue.id !== priorityQueue.id) {
      desiredConnections.push({
        fromNodeId: primaryQueue.id,
        toNodeId: priorityQueue.id,
        kind: 'service',
      })
    }

    if (
      priorityQueue &&
      deadLetterQueue &&
      priorityQueue.id !== deadLetterQueue.id
    ) {
      desiredConnections.push({
        fromNodeId: priorityQueue.id,
        toNodeId: deadLetterQueue.id,
        kind: 'service',
      })
    }

    if (primaryQueue) {
      workers.forEach((worker) => {
        desiredConnections.push({
          fromNodeId: primaryQueue.id,
          toNodeId: worker.id,
          kind: 'service',
        })
      })
    }

    if (priorityQueue) {
      workers.forEach((worker, index) => {
        if (index % 2 === 0) {
          desiredConnections.push({
            fromNodeId: priorityQueue.id,
            toNodeId: worker.id,
            kind: 'service',
          })
        }
      })
    }

    workers.forEach((worker, index) => {
      const database = databases[index % Math.max(databases.length, 1)]
      if (database) {
        desiredConnections.push({
          fromNodeId: worker.id,
          toNodeId: database.id,
          kind: 'storage',
        })
      }

      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: worker.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: worker.id,
          kind: 'telemetry',
        })
      }
    })

    databases.forEach((database) => {
      if (metricsNode) {
        desiredConnections.push({
          fromNodeId: metricsNode.id,
          toNodeId: database.id,
          kind: 'telemetry',
        })
      }

      if (logsNode) {
        desiredConnections.push({
          fromNodeId: logsNode.id,
          toNodeId: database.id,
          kind: 'telemetry',
        })
      }
    })

    const existingByKey = new Map(
      connectionsRef.current.map((connection) => [connection.key, connection]),
    )

    connectionsRef.current = desiredConnections.map((descriptor) => {
      const key = `${descriptor.fromNodeId}:${descriptor.toNodeId}:${descriptor.kind}`
      const existing = existingByKey.get(key)
      if (existing) {
        return existing
      }

      return {
        id: connectionIdRef.current++,
        key,
        fromNodeId: descriptor.fromNodeId,
        toNodeId: descriptor.toNodeId,
        kind: descriptor.kind,
        establishProgress: 0,
        isEstablished: false,
        establishSpeed:
          descriptor.kind === 'ingress'
            ? 0.03
            : descriptor.kind === 'loadBalancer'
              ? 0.024
              : 0.018,
        lastPacketTime: timeRef.current,
        packetInterval: getBasePacketInterval(descriptor.kind),
      }
    })
  }, [])

  const createPacket = useCallback((connection: Connection): DataPacket => {
    return {
      id: packetIdRef.current++,
      connectionKey: connection.key,
      progress: 0,
      speed: getPacketSpeed(connection.kind),
      type: getPacketType(connection.kind),
      size: getPacketSize(connection.kind),
      direction: getPacketDirection(connection.kind),
    }
  }, [])

  useEffect(() => {
    const checkClasses = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
      setIsFocused(
        document.documentElement.classList.contains('animation-focus'),
      )
    }

    checkClasses()

    const observer = new MutationObserver(checkClasses)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    isFocusedRef.current = isFocused
    emitClusterSnapshot(true)
  }, [emitClusterSnapshot, isFocused])

  useEffect(() => {
    const handleTriggerEmergency = (event: Event) => {
      const customEvent = event as CustomEvent<{
        scenarioKey?: EmergencyScenarioKey
        triggerSource?: TriggerSource
      }>
      startEmergency(
        customEvent.detail?.scenarioKey,
        customEvent.detail?.triggerSource ?? null,
      )
    }

    window.addEventListener(
      TRIGGER_NETWORK_EMERGENCY_EVENT,
      handleTriggerEmergency,
    )
    return () =>
      window.removeEventListener(
        TRIGGER_NETWORK_EMERGENCY_EVENT,
        handleTriggerEmergency,
      )
  }, [startEmergency])

  useEffect(() => {
    const handleCallAssignments = (event: Event) => {
      const customEvent = event as CustomEvent<AmbientCallAssignment[]>
      callAssignmentsRef.current = customEvent.detail ?? []
    }

    window.addEventListener(
      NETWORK_CALL_ASSIGNMENTS_EVENT,
      handleCallAssignments,
    )
    return () =>
      window.removeEventListener(
        NETWORK_CALL_ASSIGNMENTS_EVENT,
        handleCallAssignments,
      )
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const keyboardRotationInput = keyboardRotationInputRef.current
    let width = window.innerWidth
    let height = window.innerHeight
    let centerX = width / 2
    let centerY = height / 2

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      centerX = width / 2
      centerY = height / 2
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      nodesRef.current = initNodes(width, height)
      connectionsRef.current = []
      packetsRef.current = []
      statusIndicatorsRef.current = []
      toastQueueRef.current = []
      activeToastRef.current = []
      toastSignatureRef.current = ''
      setVisibleToasts([])
      syncConnections()
      emitClusterSnapshot(true)
    }

    const handleWheel = (event: WheelEvent) => {
      if (!isFocusedRef.current) {
        return
      }

      event.preventDefault()
      zoomRef.current.target = clamp(
        zoomRef.current.target + event.deltaY * 0.34,
        CAMERA_ZOOM_MIN,
        CAMERA_ZOOM_MAX,
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusedRef.current) {
        return
      }

      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.tagName === 'SELECT')
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          keyboardRotationInput.left = true
          event.preventDefault()
          break
        case 'ArrowRight':
          keyboardRotationInput.right = true
          event.preventDefault()
          break
        case 'ArrowUp':
          keyboardRotationInput.up = true
          event.preventDefault()
          break
        case 'ArrowDown':
          keyboardRotationInput.down = true
          event.preventDefault()
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          keyboardRotationInput.left = false
          break
        case 'ArrowRight':
          keyboardRotationInput.right = false
          break
        case 'ArrowUp':
          keyboardRotationInput.up = false
          break
        case 'ArrowDown':
          keyboardRotationInput.down = false
          break
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    const animate = () => {
      if (!isFocusedRef.current && frameSkipRef.current % 2 === 0) {
        frameSkipRef.current += 1
        timeRef.current += 0.016
        emitClusterSnapshot()
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      frameSkipRef.current += 1
      timeRef.current += 0.016

      ctx.clearRect(0, 0, width, height)

      const targetFocus = isFocusedRef.current ? 1 : 0
      focusTransitionRef.current +=
        (targetFocus - focusTransitionRef.current) * 0.05
      const focusLevel = focusTransitionRef.current
      const motionFocusLevel = getSteppedMotionLevel(focusLevel)
      const zoomState = zoomRef.current

      if (!isFocusedRef.current) {
        zoomState.target *= 0.88
        if (Math.abs(zoomState.target) < 1) {
          zoomState.target = 0
        }
      }

      zoomState.current +=
        (zoomState.target - zoomState.current) * (0.08 + focusLevel * 0.08)
      if (
        Math.abs(zoomState.current) < 0.35 &&
        Math.abs(zoomState.target) < 0.35
      ) {
        zoomState.current = 0
      }
      const baseZoomOffset = lerp(
        CAMERA_BASE_ZOOM_IDLE,
        CAMERA_BASE_ZOOM_FOCUSED,
        focusLevel,
      )
      setCameraZoomOffset(baseZoomOffset + zoomState.current)

      const rotationSpeed =
        ROTATION_SPEED_NORMAL +
        (ROTATION_SPEED_FOCUSED - ROTATION_SPEED_NORMAL) * motionFocusLevel
      const horizontalInput =
        (keyboardRotationInput.right ? 1 : 0) -
        (keyboardRotationInput.left ? 1 : 0)
      const verticalInput =
        (keyboardRotationInput.down ? 1 : 0) -
        (keyboardRotationInput.up ? 1 : 0)
      const manualRotation = manualRotationRef.current
      const hasKeyboardRotationInput =
        isFocusedRef.current && (horizontalInput !== 0 || verticalInput !== 0)
      const yawSteerSpeed = (0.014 + motionFocusLevel * 0.008) * focusLevel
      const pitchSteerSpeed = (0.014 + motionFocusLevel * 0.008) * focusLevel
      const recoverySpeed = rotationSpeed

      if (!hasKeyboardRotationInput) {
        autoRotationYRef.current += rotationSpeed
        const targetAutoRotationX = Math.sin(timeRef.current * 0.1) * 0.14
        autoRotationXRef.current += clamp(
          targetAutoRotationX - autoRotationXRef.current,
          -rotationSpeed,
          rotationSpeed,
        )
      }

      const autoRotationY = autoRotationYRef.current
      const autoRotationX = autoRotationXRef.current

      if (hasKeyboardRotationInput) {
        manualRotation.y = wrapAngle(
          manualRotation.y + horizontalInput * yawSteerSpeed,
        )
        manualRotation.x = wrapAngle(
          manualRotation.x + verticalInput * pitchSteerSpeed,
        )
      } else {
        manualRotation.y = wrapAngle(
          manualRotation.y +
            clamp(-manualRotation.y, -recoverySpeed, recoverySpeed),
        )
        manualRotation.x = wrapAngle(
          manualRotation.x +
            clamp(-manualRotation.x, -recoverySpeed, recoverySpeed),
        )
      }

      rotationRef.current.y = autoRotationY + manualRotation.y
      rotationRef.current.x = autoRotationX + manualRotation.x

      const rotX = rotationRef.current.x
      const rotY = rotationRef.current.y

      if (isFocusedRef.current) {
        const emergency = emergencyRef.current
        if (!emergency.hasEverFocused) {
          emergency.hasEverFocused = true
        }
        emergency.accumulatedFocusTime += 0.016
      }

      const emergency = emergencyRef.current
      const currentEmergencyState = getEmergencyState()
      const cluster = clusterRef.current

      cluster.trafficSpikeLevel +=
        ((cluster.isTrafficSpike ? cluster.trafficSpikeSeverity : 0) -
          cluster.trafficSpikeLevel) *
        0.03

      if (
        currentEmergencyState === 'normal' &&
        !cluster.isTrafficSpike &&
        timeRef.current > cluster.nextTrafficSpikeTime
      ) {
        cluster.isTrafficSpike = true
        cluster.trafficSpikeEndTime = timeRef.current + 10 + Math.random() * 6
        cluster.trafficSpikeSeverity = 0.5 + Math.random() * 0.5
        cluster.nextTrafficTargetRefreshTime = timeRef.current + 1.8
        cluster.desiredServiceReplicas = {
          edge: getTrafficSpikeReplicaTarget(
            'edge',
            cluster.trafficSpikeSeverity,
          ),
          auth: getTrafficSpikeReplicaTarget(
            'auth',
            cluster.trafficSpikeSeverity,
          ),
          catalog: getTrafficSpikeReplicaTarget(
            'catalog',
            cluster.trafficSpikeSeverity,
          ),
          basket: getTrafficSpikeReplicaTarget(
            'basket',
            cluster.trafficSpikeSeverity,
          ),
          checkout: getTrafficSpikeReplicaTarget(
            'checkout',
            cluster.trafficSpikeSeverity,
          ),
          warehouse: getTrafficSpikeReplicaTarget(
            'warehouse',
            cluster.trafficSpikeSeverity,
          ),
        }
        cluster.desiredReplicas = Object.values(
          cluster.desiredServiceReplicas,
        ).reduce((sum, count) => sum + count, 0)
        cluster.nextScaleActionTime = timeRef.current + 0.14
        pushClusterEvent(
          'warn',
          'ingress traffic spike detected; autoscaler is rolling more service pods into the private network',
        )
      } else if (
        cluster.isTrafficSpike &&
        timeRef.current > cluster.trafficSpikeEndTime
      ) {
        cluster.isTrafficSpike = false
        cluster.trafficSpikeSeverity = 0
        cluster.nextTrafficTargetRefreshTime = 0
        cluster.desiredReplicas = Object.values(
          cluster.desiredServiceReplicas,
        ).reduce((sum, count) => sum + count, 0)
        cluster.nextTrafficSpikeTime = timeRef.current + 5 + Math.random() * 7
        cluster.nextScaleActionTime = timeRef.current + 0.22
        cluster.nextScaleCooldownTime = timeRef.current + 0.45
        pushClusterEvent(
          'info',
          'ingress traffic normalized; autoscaler is tapering excess pods back out',
        )
      } else if (cluster.isTrafficSpike) {
        rebalanceTrafficSpikeTargets()
      }

      if (currentEmergencyState === 'normal' && !cluster.isTrafficSpike) {
        relaxReplicaTargetsTowardsBaseline()
        rebalanceAmbientReplicaTargets()
      }

      if (currentEmergencyState === 'normal') {
        runAutoscaler()
      }

      if (
        emergency.hasEverFocused &&
        !emergency.hasTriggeredFirstEmergency &&
        !emergency.isActive &&
        !emergency.isRecovery &&
        emergency.accumulatedFocusTime > emergency.firstEmergencyDelay
      ) {
        startEmergency(undefined, 'hover-auto')
      } else if (
        emergency.hasTriggeredFirstEmergency &&
        !emergency.isActive &&
        !emergency.isRecovery &&
        timeRef.current - emergency.lastEmergencyTime >
          emergency.nextEmergencyInterval
      ) {
        startEmergency()
      }

      if (
        currentEmergencyState === 'normal' &&
        !cluster.isTrafficSpike &&
        !hasRollingReplacementInFlight() &&
        timeRef.current > cluster.nextAmbientFailureTime
      ) {
        if (triggerPodFailure('ambient')) {
          cluster.nextAmbientFailureTime =
            timeRef.current + 14 + Math.random() * 14
        }
      }

      if (emergency.isActive) {
        if (
          emergency.triggeredFailures < emergency.failureTarget &&
          timeRef.current >= emergency.nextFailureTime &&
          !hasRollingReplacementInFlight()
        ) {
          if (triggerPodFailure('emergency')) {
            emergency.triggeredFailures += 1
          }
          emergency.nextFailureTime = timeRef.current + 2.8
        }

        if (timeRef.current - emergency.startTime > emergency.duration) {
          emergency.isActive = false
          emergency.isRecovery = true
          emergency.recoveryStartTime = timeRef.current
          emergency.recoveryAnnounced = false
          window.dispatchEvent(
            new CustomEvent('network-emergency', {
              detail: { type: 'recovery' },
            }),
          )
        }
      }

      if (emergency.isRecovery) {
        if (!emergency.recoveryAnnounced) {
          emergency.recoveryAnnounced = true
          pushClusterEvent(
            'success',
            'deployment controller is reconciling replicas; healthy pods are taking traffic again',
          )
          enqueueEventToast({
            title: 'CLUSTER RECOVERING',
            subtitle: 'replacement pods are joining the service mesh',
            mode: 'recovery',
            accentColor: 'rgba(74, 222, 128, 0.84)',
            duration: 6,
          })
        }

        if (
          timeRef.current - emergency.recoveryStartTime >
          emergency.recoveryDuration
        ) {
          emergency.isRecovery = false
          emergency.lastEmergencyTime = timeRef.current
          emergency.triggerSource = null
          emergency.nextEmergencyInterval = isFocusedRef.current
            ? AUTO_EMERGENCY_INTERVAL_SECONDS
            : AUTO_EMERGENCY_INTERVAL_SECONDS +
              Math.random() * AUTO_EMERGENCY_JITTER_SECONDS
          window.dispatchEvent(
            new CustomEvent('network-emergency', { detail: { type: 'end' } }),
          )
          emitClusterSnapshot(true)
        }
      }

      activeToastRef.current = activeToastRef.current.flatMap((toast) => {
        const age = timeRef.current - toast.shownAt

        if (age <= toast.duration) {
          return [toast]
        }

        if (toast.exitingAt === null) {
          return [{ ...toast, exitingAt: timeRef.current }]
        }

        return timeRef.current - toast.exitingAt <= TOAST_EXIT_DURATION
          ? [toast]
          : []
      })

      while (
        activeToastRef.current.length < 3 &&
        toastQueueRef.current.length > 0
      ) {
        const nextToast = toastQueueRef.current.shift()
        if (nextToast) {
          nextToast.shownAt = timeRef.current
          activeToastRef.current.push(nextToast)
        }
      }

      syncVisibleToasts()

      nodesRef.current = nodesRef.current.flatMap((node) => {
        if (node.role !== 'appPod') {
          return [node]
        }

        const age = timeRef.current - node.statusSince
        const drainDuration = node.scaleDownTarget
          ? SCALE_DOWN_DRAIN_DURATION
          : DRAIN_DURATION

        if (node.lifecycleState === 'draining' && age > drainDuration) {
          if (node.scaleDownTarget) {
            node.lifecycleState = 'terminating'
            node.statusSince = timeRef.current
            pushClusterEvent(
              'info',
              `autoscaler removed ${node.label} from ${node.replicaGroup} after traffic cooled`,
            )
          } else {
            node.lifecycleState = 'unhealthy'
            node.statusSince = timeRef.current
            node.replacementLaunched = false
            pushClusterEvent(
              'error',
              `${node.label} failed its last health check; replacement requested`,
            )
          }
        } else if (
          node.lifecycleState === 'unhealthy' &&
          age > UNHEALTHY_DURATION &&
          !node.replacementLaunched &&
          !nodesRef.current.some(
            (candidate) =>
              candidate.role === 'appPod' &&
              candidate.lifecycleState === 'starting',
          )
        ) {
          createReplacementPod(node)
          node.replacementLaunched = true
          pushClusterEvent(
            currentEmergencyState === 'emergency' ? 'error' : 'info',
            `scheduler is bringing up a replacement for ${node.label} before shutdown`,
          )
        } else if (
          node.lifecycleState === 'terminating' &&
          age > TERMINATING_DURATION
        ) {
          return []
        } else if (
          node.lifecycleState === 'starting' &&
          age > STARTING_DURATION
        ) {
          node.lifecycleState = 'ready'
          node.acceptingTraffic = true
          node.scaleDownTarget = false
          node.statusSince = timeRef.current
          node.replacementLaunched = true
          if (node.replacementFor) {
            const previousPod = nodesRef.current.find(
              (candidate) =>
                candidate.role === 'appPod' &&
                candidate.label === node.replacementFor &&
                candidate.lifecycleState === 'unhealthy',
            )

            if (previousPod) {
              previousPod.lifecycleState = 'terminating'
              previousPod.statusSince = timeRef.current
              pushClusterEvent(
                currentEmergencyState === 'emergency' ? 'error' : 'warn',
                `rolling update is shutting down ${previousPod.label} after ${node.label} joined the pool`,
              )
            }
          } else {
            pushClusterEvent(
              'success',
              `${node.label} is ready; ${node.replicaGroup} has one more pod on the private network`,
            )
          }
          if (node.replicaGroup === 'edge') {
            pushClusterEvent(
              currentEmergencyState === 'emergency' && node.replacementFor
                ? 'error'
                : 'success',
              `${node.label} became ready; lb-ext added it back into rotation`,
            )
          }
        }

        return [node]
      })

      syncConnections()

      relayoutServicePods()

      nodesRef.current.forEach((node) => {
        if (node.role !== 'appPod') {
          return
        }

        node.velocityX =
          (node.velocityX + (node.targetX - node.x) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING
        node.velocityY =
          (node.velocityY + (node.targetY - node.y) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING
        node.velocityZ =
          (node.velocityZ + (node.targetZ - node.z) * POD_LAYOUT_STIFFNESS) *
          POD_LAYOUT_DAMPING

        node.x += node.velocityX
        node.y += node.velocityY
        node.z += node.velocityZ
      })

      nodesRef.current.forEach((node) => {
        node.pulse += node.pulseSpeed * (0.72 + focusLevel * 0.72)
        const projected = project3D(
          node.x,
          node.y,
          node.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        node.screenX = projected.screenX
        node.screenY = projected.screenY
        node.screenScale = projected.scale
      })

      const nodeMap = new Map(nodesRef.current.map((node) => [node.id, node]))

      connectionsRef.current = connectionsRef.current.filter((connection) => {
        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)

        if (!fromNode || !toNode) {
          return false
        }

        if (!connection.isEstablished) {
          connection.establishProgress +=
            connection.establishSpeed * (0.68 + focusLevel * 0.8)
          if (connection.establishProgress >= 1) {
            connection.establishProgress = 1
            connection.isEstablished = true
          }
        }

        return true
      })

      const sortedNodes = [...nodesRef.current].sort((nodeA, nodeB) => {
        const a = project3D(
          nodeA.x,
          nodeA.y,
          nodeA.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const b = project3D(
          nodeB.x,
          nodeB.y,
          nodeB.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        return a.z - b.z
      })

      connectionsRef.current.forEach((connection) => {
        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)

        if (!fromNode || !toNode) {
          return
        }

        const from = project3D(
          fromNode.x,
          fromNode.y,
          fromNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const to = project3D(
          toNode.x,
          toNode.y,
          toNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )

        const lineProgress = connection.establishProgress
        const currentX =
          from.screenX + (to.screenX - from.screenX) * lineProgress
        const currentY =
          from.screenY + (to.screenY - from.screenY) * lineProgress
        const avgZ = (from.z + to.z) / 2
        const depthFade = clamp(
          (PERSPECTIVE + avgZ) / (PERSPECTIVE * 1.8),
          0.28,
          1,
        )
        const fromIncident =
          fromNode.lifecycleState === 'draining' ||
          fromNode.lifecycleState === 'unhealthy' ||
          fromNode.lifecycleState === 'terminating'
        const toIncident =
          toNode.lifecycleState === 'draining' ||
          toNode.lifecycleState === 'unhealthy' ||
          toNode.lifecycleState === 'terminating'
        const baseOpacity =
          getConnectionBaseOpacity(connection.kind, focusLevel) * depthFade
        const opacity = baseOpacity * (toIncident || fromIncident ? 0.9 : 1)

        ctx.strokeStyle = getConnectionStrokeColor(
          connection.kind,
          fromIncident || toIncident,
          isDark,
          opacity,
        )
        ctx.lineWidth =
          connection.kind === 'ingress'
            ? isDark
              ? 1.45
              : 1.75
            : connection.kind === 'loadBalancer'
              ? isDark
                ? 1.1
                : 1.3
              : connection.kind === 'telemetry'
                ? isDark
                  ? 0.95
                  : 1.15
                : isDark
                  ? 0.75
                  : 1.05

        if (
          connection.kind === 'loadBalancer' ||
          connection.kind === 'service'
        ) {
          const dashOffset = (timeRef.current * 18) % 24
          ctx.setLineDash(connection.kind === 'loadBalancer' ? [5, 7] : [4, 9])
          ctx.lineDashOffset = -dashOffset
        } else if (connection.kind === 'telemetry') {
          ctx.setLineDash([2, 8])
        }

        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(from.screenX, from.screenY)
        if (connection.isEstablished) {
          const control = getConnectionControlPoint(
            connection,
            fromNode,
            toNode,
            from,
            to,
            centerX,
            centerY,
            rotX,
            rotY,
          )
          ctx.quadraticCurveTo(control.x, control.y, to.screenX, to.screenY)
        } else {
          ctx.lineTo(currentX, currentY)
        }
        ctx.stroke()
        ctx.setLineDash([])

        const targetReady =
          connection.kind === 'loadBalancer'
            ? toNode.lifecycleState === 'ready' && toNode.acceptingTraffic
            : connection.kind === 'ingress'
              ? true
              : connection.kind === 'telemetry'
                ? toNode.lifecycleState !== 'starting' &&
                  toNode.lifecycleState !== 'terminating'
                : (fromNode.lifecycleState === 'ready' ||
                    fromNode.lifecycleState === 'healthy') &&
                  (toNode.lifecycleState === 'healthy' ||
                    toNode.lifecycleState === 'ready')

        const packetIntervalMultiplier =
          1.55 -
          focusLevel * 0.72 -
          (currentEmergencyState === 'emergency' ? 0.25 : 0)
        if (
          connection.isEstablished &&
          targetReady &&
          timeRef.current - connection.lastPacketTime >
            connection.packetInterval * packetIntervalMultiplier
        ) {
          packetsRef.current.push(createPacket(connection))
          connection.lastPacketTime = timeRef.current
          connection.packetInterval = getBasePacketInterval(connection.kind)

          if (
            connection.kind === 'loadBalancer' &&
            Math.random() < 0.2 + focusLevel * 0.25
          ) {
            const response = createPacket(connection)
            response.direction = -1
            response.type = 'udp'
            response.size = 2
            packetsRef.current.push(response)
          }
        }
      })

      const connectionMap = new Map(
        connectionsRef.current.map((connection) => [
          connection.key,
          connection,
        ]),
      )

      packetsRef.current = packetsRef.current.filter((packet) => {
        const connection = connectionMap.get(packet.connectionKey)
        if (!connection) {
          return false
        }

        const fromNode = nodeMap.get(connection.fromNodeId)
        const toNode = nodeMap.get(connection.toNodeId)
        if (!fromNode || !toNode) {
          return false
        }

        packet.progress += packet.speed * (0.62 + focusLevel * 0.9)
        if (packet.progress >= 1) {
          const targetNode = packet.direction === 1 ? toNode : fromNode
          let statusType: StatusIndicator['type'] = 'success'
          let label: string | undefined
          let shouldShowIndicator = false
          const scenarioAffectsTargetNode = isScenarioAffectingNode(
            targetNode,
            currentEmergencyState,
            emergencyRef.current.scenarioKey,
          )

          if (
            targetNode.lifecycleState === 'draining' ||
            targetNode.lifecycleState === 'unhealthy' ||
            scenarioAffectsTargetNode
          ) {
            statusType = 'failure'
            shouldShowIndicator = Math.random() < 0.5
          } else if (targetNode.lifecycleState === 'starting') {
            statusType = 'warning'
            shouldShowIndicator = Math.random() < 0.3
          } else if (currentEmergencyState === 'recovery') {
            shouldShowIndicator = Math.random() < 0.12
          } else if (connection.kind === 'telemetry') {
            statusType = 'warning'
            shouldShowIndicator = false
          } else {
            shouldShowIndicator = Math.random() < 0.05 + focusLevel * 0.03
          }

          if (shouldShowIndicator) {
            statusIndicatorsRef.current.push(
              createStatusIndicator(
                statusIdRef.current++,
                timeRef.current,
                targetNode.id,
                statusType,
                label,
              ),
            )
          }
          return false
        }

        const from = project3D(
          fromNode.x,
          fromNode.y,
          fromNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const to = project3D(
          toNode.x,
          toNode.y,
          toNode.z,
          centerX,
          centerY,
          rotX,
          rotY,
        )

        const control = getConnectionControlPoint(
          connection,
          fromNode,
          toNode,
          from,
          to,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const headT =
          packet.direction === 1 ? packet.progress : 1 - packet.progress
        const headPoint = getQuadraticPoint(
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          headT,
        )
        const x = headPoint.x
        const y = headPoint.y
        const packetZ = from.z + (to.z - from.z) * headT
        const depthFade = clamp(
          (PERSPECTIVE + packetZ) / (PERSPECTIVE * 1.9),
          0.35,
          1,
        )
        const targetNode = packet.direction === 1 ? toNode : fromNode
        const palette =
          COLORS[
            getNodePalette(
              targetNode,
              timeRef.current,
              currentEmergencyState,
              emergencyRef.current.scenarioKey,
            ).colorKey
          ]

        const trailLength = packet.type === 'tcp' ? 0.16 : 0.1
        const tailT =
          packet.direction === 1
            ? Math.max(0, headT - trailLength)
            : Math.min(1, headT + trailLength)
        const tailPoint = getQuadraticPoint(
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          tailT,
        )
        const trailX = tailPoint.x
        const trailY = tailPoint.y

        const gradient = ctx.createLinearGradient(trailX, trailY, x, y)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(
          1,
          withOpacity(palette.main, (isDark ? 0.38 : 0.46) * depthFade),
        )

        ctx.beginPath()
        drawQuadraticSegment(
          ctx,
          from.screenX,
          from.screenY,
          control.x,
          control.y,
          to.screenX,
          to.screenY,
          tailT,
          headT,
        )
        ctx.strokeStyle = gradient
        ctx.lineWidth =
          connection.kind === 'ingress'
            ? 2.4
            : connection.kind === 'loadBalancer'
              ? 2
              : packet.type === 'tcp'
                ? 1.8
                : 1.35
        if (packet.type === 'udp') {
          ctx.setLineDash([4, 4])
        }
        ctx.stroke()
        ctx.setLineDash([])

        const headOpacity = (isDark ? 0.78 : 0.88) * depthFade
        const size =
          packet.size *
          depthFade *
          (Math.sin(timeRef.current * 8 + packet.id) * 0.22 + 1)
        ctx.fillStyle = withOpacity(palette.main, headOpacity)

        if (packet.type === 'tcp') {
          ctx.beginPath()
          ctx.moveTo(x, y - size)
          ctx.lineTo(x + size, y)
          ctx.lineTo(x, y + size)
          ctx.lineTo(x - size, y)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, size * 0.82, 0, Math.PI * 2)
          ctx.fill()
        }
        return true
      })

      sortedNodes.forEach((node) => {
        const { colorKey, attention } = getNodePalette(
          node,
          timeRef.current,
          currentEmergencyState,
          emergencyRef.current.scenarioKey,
        )
        const palette = COLORS[colorKey]
        const visibility = getNodeVisibility(node, timeRef.current)
        const scaleMultiplier = getNodeScaleMultiplier(node, timeRef.current)
        const scale = node.screenScale * scaleMultiplier
        const currentSize = node.size * scale
        const depthFade = clamp(scale, 0.28, 1)
        const pulseOpacity =
          (attention + Math.sin(node.pulse) * 0.05) * depthFade * visibility
        const fillColor = withOpacity(palette.fill, pulseOpacity * 0.22)
        const strokeColor = withOpacity(palette.main, pulseOpacity * 0.95)

        if (visibility <= 0) {
          return
        }

        if (node.role === 'appPod') {
          const microSize = currentSize * 0.46
          const microOpacity = pulseOpacity * 0.28

          drawHexagon(
            ctx,
            node.screenX,
            node.screenY,
            microSize,
            withOpacity(palette.main, microOpacity * 0.9),
            withOpacity(palette.fill, microOpacity * 0.16),
            0.9 * depthFade,
          )
          return
        }

        const topologyNodeBoost =
          node.role === 'loadBalancer' || node.role === 'ingress'
            ? 1.2
            : node.role === 'database' || node.role === 'cache'
              ? 1.1
              : 1.04
        const topologyGlowOpacity =
          node.role === 'loadBalancer' || node.role === 'ingress' ? 0.2 : 0.14

        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * 1.34 * topologyNodeBoost,
          withOpacity(palette.glow, pulseOpacity * topologyGlowOpacity),
          withOpacity(palette.fill, pulseOpacity * 0.06),
          0.72 * depthFade,
        )
        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * topologyNodeBoost,
          strokeColor,
          withOpacity(palette.fill, pulseOpacity * 0.3),
          1.35 * depthFade,
        )
        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * 0.52 * topologyNodeBoost,
          withOpacity(palette.glow, pulseOpacity * 0.34),
          withOpacity(palette.fill, pulseOpacity * 0.12),
          0.72 * depthFade,
        )
        drawHexagon(
          ctx,
          node.screenX,
          node.screenY,
          currentSize * 0.24 * topologyNodeBoost,
          withOpacity(palette.main, pulseOpacity * 0.4),
          null,
          0.68 * depthFade,
        )

        if (depthFade > 0.6) {
          const labelOpacity = (isDark ? 0.82 : 0.86) * depthFade * visibility
          const fontSize =
            node.role === 'loadBalancer' || node.role === 'ingress'
              ? 9
              : node.role === 'database' || node.role === 'cache'
                ? 7
                : node.label.length > 7
                  ? 5.5
                  : 6.5
          const labelY =
            node.role === 'ingress' || node.role === 'loadBalancer'
              ? node.screenY - currentSize * 1.55
              : node.screenY + currentSize * 1.38
          const labelText = node.label
          const font = `bold ${Math.round(fontSize * depthFade)}px ui-monospace, monospace`
          ctx.font = font
          const labelWidth = ctx.measureText(labelText).width
          const pillWidth = labelWidth + 18
          const pillHeight = Math.max(16, fontSize * 1.9)

          ctx.save()
          drawRoundedRectPath(
            ctx,
            node.screenX - pillWidth / 2,
            labelY - pillHeight / 2,
            pillWidth,
            pillHeight,
            3,
          )
          ctx.fillStyle = isDark
            ? `rgba(2, 6, 23, ${0.74 * labelOpacity})`
            : `rgba(255, 255, 255, ${0.84 * labelOpacity})`
          ctx.fill()
          ctx.strokeStyle = withOpacity(
            palette.main,
            isDark ? 0.34 * labelOpacity : 0.3 * labelOpacity,
          )
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.restore()

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          drawPanelText(ctx, {
            text: labelText,
            x: node.screenX,
            y: labelY,
            font,
            fillStyle: isDark
              ? `rgba(248, 250, 252, ${labelOpacity})`
              : `rgba(15, 23, 42, ${labelOpacity})`,
            plateIsDark: isDark,
            emphasis:
              node.role === 'loadBalancer' || node.role === 'ingress'
                ? 'title'
                : 'meta',
          })
        }
      })

      statusIndicatorsRef.current = statusIndicatorsRef.current.filter(
        (indicator) =>
          drawStatusIndicator(ctx, indicator, timeRef.current, isDark, nodeMap),
      )

      const serviceProjectionMap = new Map(
        appServicesRef.current.map((service) => [
          service.name,
          getProjectedServiceClusterEnvelope(
            service,
            centerX,
            centerY,
            rotX,
            rotY,
          ),
        ]),
      )
      const occupiedLayoutZones: OccupiedLayoutZone[] = [
        ...[...serviceProjectionMap.values()].map((projection) => ({
          x: projection.screenX,
          y: projection.screenY,
          radius: projection.radius,
        })),
        ...nodesRef.current
          .filter((node) => node.role !== 'appPod')
          .map((node) => ({
            x: node.screenX,
            y: node.screenY,
            radius: Math.max(18, node.size * node.screenScale * 3.6),
          })),
      ]
      const placedPanelZones: OccupiedPanelZone[] = []
      const servicePanelPlacementMap = new Map<
        AppServiceGroup,
        {
          x: number
          y: number
          width: number
          height: number
        }
      >()

      appServicesRef.current
        .map((service) => {
          const serviceProjection = serviceProjectionMap.get(service.name)
          if (!serviceProjection) {
            return null
          }

          const projected = project3D(
            service.centerX,
            service.centerY - 52,
            service.centerZ,
            centerX,
            centerY,
            rotX,
            rotY,
          )
          const depthFade = clamp(projected.scale, 0.3, 1)
          const servicePods = nodesRef.current.filter(
            (node) =>
              node.role === 'appPod' &&
              node.replicaGroup === service.name &&
              node.lifecycleState !== 'terminating',
          )

          if (depthFade < 0.48 || servicePods.length === 0) {
            return null
          }

          const readyPods = servicePods.filter(
            (node) => node.lifecycleState === 'ready' && node.acceptingTraffic,
          ).length
          const startingPods = servicePods.filter(
            (node) => node.lifecycleState === 'starting',
          ).length
          const desiredPods =
            clusterRef.current.desiredServiceReplicas[service.name] ??
            servicePods.length
          const capacityPods = service.maxReplicas
          const drainingPods = servicePods.filter(
            (node) => node.lifecycleState === 'draining',
          ).length
          const unhealthyPods = servicePods.filter(
            (node) =>
              node.lifecycleState === 'unhealthy' ||
              node.lifecycleState === 'terminating',
          ).length
          const footprintPods = getServiceClusterFootprintPodCount({
            ready: readyPods,
            starting: startingPods,
            draining: drainingPods,
          })
          const titleFont = `bold ${Math.max(10, Math.round(10 * depthFade))}px ui-monospace, monospace`
          const metaFont = `${Math.max(9, Math.round(9 * depthFade))}px ui-monospace, monospace`
          const statusFont = `${Math.max(8, Math.round(8 * depthFade))}px ui-monospace, monospace`
          const statusDisplay = getServiceStatusDisplay(
            service.name,
            {
              ready: readyPods,
              starting: startingPods,
              draining: drainingPods,
              unhealthy: unhealthyPods,
              total: servicePods.length,
              desired: desiredPods,
            },
            {
              emergencyState: currentEmergencyState,
              emergencyScenarioKey: emergencyRef.current.scenarioKey,
              isTrafficSpike: clusterRef.current.isTrafficSpike,
              isDark,
              metaOpacity: 0.9,
            },
          )

          ctx.font = titleFont
          const titleWidth = ctx.measureText(service.displayLabel).width
          ctx.font = metaFont
          const readyWidth = ctx.measureText(
            `${readyPods}/${capacityPods} ready`,
          ).width
          ctx.font = statusFont
          const statusWidth = ctx.measureText(statusDisplay.text).width
          const panelWidth =
            Math.max(titleWidth, readyWidth, statusWidth, 92) + 34
          const panelHeight = 60
          const clusterRadius = getServiceClusterShellRadius(
            footprintPods,
            capacityPods,
            serviceProjection.scale,
          )

          return {
            serviceName: service.name,
            clusterX: serviceProjection.screenX,
            clusterY: serviceProjection.screenY + 4,
            clusterRadius,
            panelWidth,
            panelHeight,
            priority:
              serviceProjection.scale * 1000 -
              Math.hypot(
                serviceProjection.screenX - centerX,
                serviceProjection.screenY - centerY,
              ),
          }
        })
        .filter(
          (placement): placement is NonNullable<typeof placement> =>
            !!placement,
        )
        .sort((left, right) => right.priority - left.priority)
        .forEach((placement) => {
          const panelPosition = chooseServicePanelPlacement({
            clusterX: placement.clusterX,
            clusterY: placement.clusterY,
            clusterRadius: placement.clusterRadius,
            panelWidth: placement.panelWidth,
            panelHeight: placement.panelHeight,
            viewportWidth: width,
            viewportHeight: height,
            otherCenters: occupiedLayoutZones.filter(
              (zone) =>
                Math.hypot(
                  zone.x - placement.clusterX,
                  zone.y - placement.clusterY,
                ) > 1,
            ),
            otherPanels: placedPanelZones,
          })
          const previousPanelPlacement =
            servicePanelPlacementRef.current[placement.serviceName]
          const smoothedPanelPosition = previousPanelPlacement
            ? {
                x: lerp(previousPanelPlacement.x, panelPosition.x, 0.16),
                y: lerp(previousPanelPlacement.y, panelPosition.y, 0.16),
              }
            : panelPosition

          servicePanelPlacementMap.set(placement.serviceName, {
            x: smoothedPanelPosition.x,
            y: smoothedPanelPosition.y,
            width: placement.panelWidth,
            height: placement.panelHeight,
          })
          servicePanelPlacementRef.current[placement.serviceName] = {
            x: smoothedPanelPosition.x,
            y: smoothedPanelPosition.y,
            width: placement.panelWidth,
            height: placement.panelHeight,
          }
          placedPanelZones.push({
            x: smoothedPanelPosition.x,
            y: smoothedPanelPosition.y,
            width: placement.panelWidth,
            height: placement.panelHeight,
          })
        })

      appServicesRef.current.forEach((service) => {
        const serviceProjection = serviceProjectionMap.get(service.name)
        if (!serviceProjection) {
          return
        }

        const projected = project3D(
          service.centerX,
          service.centerY - 52,
          service.centerZ,
          centerX,
          centerY,
          rotX,
          rotY,
        )
        const depthFade = clamp(projected.scale, 0.3, 1)
        const servicePods = nodesRef.current.filter(
          (node) =>
            node.role === 'appPod' &&
            node.replicaGroup === service.name &&
            node.lifecycleState !== 'terminating',
        )

        if (depthFade < 0.48 || servicePods.length === 0) {
          return
        }

        const readyPods = servicePods.filter(
          (node) => node.lifecycleState === 'ready' && node.acceptingTraffic,
        ).length
        const startingPods = servicePods.filter(
          (node) => node.lifecycleState === 'starting',
        ).length
        const desiredPods =
          clusterRef.current.desiredServiceReplicas[service.name] ??
          servicePods.length
        const capacityPods = service.maxReplicas
        const plateIsDark = isDark
        const captionOpacity = clamp(
          (isDark ? 0.82 : 0.86) * depthFade + 0.14,
          0.88,
          1,
        )
        const metaOpacity = clamp(
          (isDark ? 0.72 : 0.76) * depthFade + 0.12,
          0.76,
          0.98,
        )
        const drainingPods = servicePods.filter(
          (node) => node.lifecycleState === 'draining',
        ).length
        const unhealthyPods = servicePods.filter(
          (node) =>
            node.lifecycleState === 'unhealthy' ||
            node.lifecycleState === 'terminating',
        ).length
        const footprintPods = getServiceClusterFootprintPodCount({
          ready: readyPods,
          starting: startingPods,
          draining: drainingPods,
        })
        const degradedPods = getServiceClusterDegradedPodCount({
          draining: drainingPods,
          unhealthy: unhealthyPods,
        })
        const motionState = serviceClusterMotionRef.current[service.name]
        const footprintDelta = Math.abs(
          footprintPods - motionState.footprintCount,
        )
        const degradedDelta = Math.abs(degradedPods - motionState.degradedCount)
        const desiredShift = desiredPods - motionState.desiredCount
        const desiredDelta = Math.abs(desiredShift)
        const scaleOutStarted = desiredPods > motionState.desiredCount
        const scaleInStarted = desiredPods < motionState.desiredCount
        const impactTarget = clamp(
          footprintDelta * 0.09 +
            Math.min(3, degradedDelta) * 0.04 +
            desiredDelta * 0.025 +
            (scaleOutStarted ? 0.028 : 0) +
            (scaleInStarted && degradedPods === 0 ? 0.02 : 0) +
            (footprintDelta >= 2 ? 0.035 : 0),
          0,
          0.32,
        )

        if (impactTarget > 0.015) {
          motionState.energy = clamp(
            motionState.energy * 0.88 + impactTarget,
            0,
            0.44,
          )
        } else {
          motionState.energy *= 0.95
        }

        if (desiredShift > 0) {
          motionState.pendingScaleOutSteps += desiredShift
        } else if (desiredShift < 0) {
          motionState.pendingScaleInSteps += Math.abs(desiredShift)
        }

        if (motionState.scaleRingDirection === 0) {
          motionState.scaleRingDirection =
            motionState.pendingScaleOutSteps > 0
              ? 1
              : motionState.pendingScaleInSteps > 0
                ? -1
                : 0
        }

        if (motionState.scaleRingDirection !== 0) {
          const activeQueueDepth =
            motionState.scaleRingDirection > 0
              ? motionState.pendingScaleOutSteps
              : motionState.pendingScaleInSteps
          const ringDuration = clamp(
            1.08 - Math.min(Math.max(activeQueueDepth - 1, 0), 5) * 0.13,
            0.34,
            1.08,
          )

          motionState.scaleRingProgress = clamp(
            motionState.scaleRingProgress + 0.016 / ringDuration,
            0,
            1.2,
          )

          if (motionState.scaleRingProgress >= 1) {
            motionState.scaleRingProgress -= 1

            if (motionState.scaleRingDirection > 0) {
              motionState.pendingScaleOutSteps = Math.max(
                0,
                motionState.pendingScaleOutSteps - 1,
              )
            } else {
              motionState.pendingScaleInSteps = Math.max(
                0,
                motionState.pendingScaleInSteps - 1,
              )
            }

            motionState.energy = clamp(motionState.energy + 0.035, 0, 0.44)

            const hasMoreInCurrentDirection =
              motionState.scaleRingDirection > 0
                ? motionState.pendingScaleOutSteps > 0
                : motionState.pendingScaleInSteps > 0

            if (!hasMoreInCurrentDirection) {
              motionState.scaleRingDirection =
                motionState.pendingScaleOutSteps > 0
                  ? 1
                  : motionState.pendingScaleInSteps > 0
                    ? -1
                    : 0

              if (motionState.scaleRingDirection === 0) {
                motionState.scaleRingProgress = 0
              }
            }
          }
        } else {
          motionState.scaleRingProgress = 0
        }

        motionState.footprintCount = footprintPods
        motionState.degradedCount = degradedPods
        motionState.desiredCount = desiredPods
        const statusDisplay = getServiceStatusDisplay(
          service.name,
          {
            ready: readyPods,
            starting: startingPods,
            draining: drainingPods,
            unhealthy: unhealthyPods,
            total: servicePods.length,
            desired: desiredPods,
          },
          {
            emergencyState: currentEmergencyState,
            emergencyScenarioKey: emergencyRef.current.scenarioKey,
            isTrafficSpike: clusterRef.current.isTrafficSpike,
            isDark: plateIsDark,
            metaOpacity,
          },
        )

        const clusterProjected = {
          ...serviceProjection,
          screenY: serviceProjection.screenY + 4,
        }
        const clusterRotation = getServiceClusterRotation(
          timeRef.current,
          motionState.energy,
          motionState.phase,
          motionFocusLevel,
        )
        drawServiceClusterHoneycomb(ctx, {
          service,
          x: clusterProjected.screenX,
          y: clusterProjected.screenY,
          scale: clusterProjected.scale,
          time: timeRef.current,
          isDark,
          emergencyState: currentEmergencyState,
          emergencyScenarioKey: emergencyRef.current.scenarioKey,
          bounceEnergy: motionState.energy,
          bouncePhase: motionState.phase,
          localRotation: clusterRotation,
          counts: {
            ready: readyPods,
            starting: startingPods,
            draining: drainingPods,
            unhealthy: unhealthyPods,
            total: servicePods.length,
            desired: desiredPods,
            capacity: capacityPods,
          },
          scaleRing: {
            progress: motionState.scaleRingProgress,
            direction: motionState.scaleRingDirection,
            queueDepth:
              motionState.scaleRingDirection > 0
                ? motionState.pendingScaleOutSteps
                : motionState.pendingScaleInSteps,
          },
        })

        const panelOpacity = clamp(
          (isDark ? 0.96 : 0.88) * depthFade + 0.08,
          0.86,
          1,
        )
        const titleFont = `bold ${Math.max(10, Math.round(10 * depthFade))}px ui-monospace, monospace`
        const metaFont = `${Math.max(9, Math.round(9 * depthFade))}px ui-monospace, monospace`
        const statusFont = `${Math.max(8, Math.round(8 * depthFade))}px ui-monospace, monospace`
        ctx.font = titleFont
        const titleWidth = ctx.measureText(service.displayLabel).width
        ctx.font = metaFont
        const readyWidth = ctx.measureText(
          `${readyPods}/${capacityPods} ready`,
        ).width
        ctx.font = statusFont
        const statusWidth = ctx.measureText(statusDisplay.text).width
        const panelWidth =
          Math.max(titleWidth, readyWidth, statusWidth, 92) + 34
        const panelHeight = 60
        const panelAccent = withOpacity(
          COLORS[service.color].main,
          isDark ? panelOpacity * 0.88 : panelOpacity * 0.78,
        )
        const activePodsForSizing = footprintPods
        const clusterRadius = getServiceClusterShellRadius(
          activePodsForSizing,
          capacityPods,
          clusterProjected.scale,
        )
        const panelPlacement = servicePanelPlacementMap.get(service.name)
        const panelPosition = panelPlacement
          ? { x: panelPlacement.x, y: panelPlacement.y }
          : chooseServicePanelPlacement({
              clusterX: clusterProjected.screenX,
              clusterY: clusterProjected.screenY,
              clusterRadius,
              panelWidth,
              panelHeight,
              viewportWidth: width,
              viewportHeight: height,
              otherCenters: occupiedLayoutZones.filter(
                (zone) =>
                  Math.hypot(
                    zone.x - clusterProjected.screenX,
                    zone.y - clusterProjected.screenY,
                  ) > 1,
              ),
            })
        const panelCenterX = panelPosition.x + panelWidth / 2

        const panelLayout = drawInfoPanel(ctx, {
          x: panelPosition.x,
          y: panelPosition.y,
          width: panelWidth,
          height: panelHeight,
          radius: 3,
          isDark,
          opacity: panelOpacity,
          accentColor: panelAccent,
          headerHeight: 12,
          footerHeight: 14,
        })

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 8px ui-monospace, monospace'
        ctx.fillStyle = plateIsDark
          ? `rgba(226, 232, 240, ${Math.max(metaOpacity * 0.9, 0.74)})`
          : `rgba(71, 85, 105, ${Math.max(metaOpacity * 0.92, 0.74)})`
        ctx.fillText(
          'SERVICE CLUSTER',
          panelCenterX,
          panelLayout.header.centerY,
        )

        drawPanelText(ctx, {
          text: service.displayLabel,
          x: panelCenterX,
          y: panelLayout.body.y + panelLayout.body.height * 0.38,
          font: titleFont,
          fillStyle: plateIsDark
            ? `rgba(248, 250, 252, ${captionOpacity})`
            : `rgba(15, 23, 42, ${captionOpacity})`,
          plateIsDark,
          emphasis: 'title',
        })

        drawPanelText(ctx, {
          text: `${readyPods}/${capacityPods} ready`,
          x: panelCenterX,
          y: panelLayout.body.y + panelLayout.body.height * 0.72,
          font: metaFont,
          fillStyle: plateIsDark
            ? `rgba(226, 232, 240, ${metaOpacity})`
            : `rgba(51, 65, 85, ${metaOpacity})`,
          plateIsDark,
          emphasis: 'meta',
        })

        drawPanelText(ctx, {
          text: statusDisplay.text,
          x: panelCenterX,
          y: panelLayout.footer.centerY,
          font: statusFont,
          fillStyle: statusDisplay.color,
          plateIsDark,
          emphasis: 'status',
        })

        const panelCallAssignments = callAssignmentsRef.current.filter(
          (assignment) => assignment.serviceName === service.name,
        )

        if (isFocusedRef.current && panelCallAssignments.length > 0) {
          drawPanelCallAssignments(ctx, {
            assignments: panelCallAssignments,
            panelX: panelPosition.x,
            panelY: panelPosition.y,
            panelWidth,
            panelHeight,
            viewportWidth: width,
            isDark: plateIsDark,
            time: timeRef.current,
            metaOpacity,
          })
        }
      })

      if (emergency.isActive) {
        const emergencyAge = timeRef.current - emergency.startTime
        const blinkOn = Math.sin(emergencyAge * Math.PI * 1.8) > 0
        if (blinkOn) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.07)'
          ctx.fillRect(0, 0, width, height)
        }
      } else if (emergency.isRecovery) {
        const recoveryAge = timeRef.current - emergency.recoveryStartTime
        const fadeOut = clamp(
          1 - recoveryAge / emergency.recoveryDuration,
          0,
          1,
        )
        ctx.fillStyle = `rgba(34, 197, 94, ${0.045 * fadeOut})`
        ctx.fillRect(0, 0, width, height)
      }

      emitClusterSnapshot()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      keyboardRotationInput.left = false
      keyboardRotationInput.right = false
      keyboardRotationInput.up = false
      keyboardRotationInput.down = false
      setCameraZoomOffset(0)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    createPacket,
    createReplacementPod,
    enqueueEventToast,
    emitClusterSnapshot,
    getAppServiceConfig,
    getConnectionControlPoint,
    getTrafficSpikeReplicaTarget,
    getEmergencyState,
    hasRollingReplacementInFlight,
    initNodes,
    mounted,
    isDark,
    pushClusterEvent,
    rebalanceAmbientReplicaTargets,
    rebalanceTrafficSpikeTargets,
    relaxReplicaTargetsTowardsBaseline,
    relayoutServicePods,
    runAutoscaler,
    startEmergency,
    syncVisibleToasts,
    syncConnections,
    triggerPodFailure,
  ])

  if (!mounted) {
    return null
  }

  const canvasOpacity = isFocused
    ? isDark
      ? 0.98
      : 0.92
    : isDark
      ? 0.12
      : 0.06

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
        style={{ opacity: canvasOpacity }}
        aria-hidden="true"
      />

      {isFocused && visibleToasts.length > 0 ? (
        <div className="pointer-events-none fixed right-6 bottom-6 z-10 flex w-[min(22rem,calc(100vw-3rem))] origin-bottom-right scale-[0.6] flex-col-reverse items-end gap-3">
          {visibleToasts.map((toast) => {
            const accentColor =
              toast.mode === 'emergency'
                ? isDark
                  ? 'rgba(248, 113, 113, 0.92)'
                  : 'rgba(220, 38, 38, 0.9)'
                : isDark
                  ? 'rgba(74, 222, 128, 0.84)'
                  : 'rgba(22, 163, 74, 0.84)'

            return (
              <div
                key={toast.id}
                className="pointer-events-auto flex min-h-[6.75rem] w-full flex-col overflow-hidden rounded-sm border px-4 py-3 shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
                style={{
                  opacity: toast.exitingAt === null ? 1 : 0,
                  transform:
                    toast.exitingAt === null
                      ? 'translateY(0) scale(1)'
                      : 'translateY(10px) scale(0.985)',
                  backgroundColor: isDark
                    ? 'rgba(10, 14, 24, 0.92)'
                    : 'rgba(255, 255, 255, 0.94)',
                  borderColor: isDark
                    ? 'rgba(148, 163, 184, 0.14)'
                    : 'rgba(148, 163, 184, 0.28)',
                  boxShadow: `0 0 0 1px ${accentColor}, 0 18px 44px ${
                    isDark ? 'rgba(2, 6, 23, 0.35)' : 'rgba(15, 23, 42, 0.12)'
                  }`,
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="font-mono text-[11px] tracking-[0.18em] uppercase"
                    style={{ color: accentColor }}
                  >
                    {toast.mode === 'emergency'
                      ? 'Incident'
                      : toast.mode === 'recovery'
                        ? 'Recovery'
                        : 'Autoscale'}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 10px ${accentColor}`,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className="font-mono text-[13px] font-semibold tracking-[0.08em] break-words uppercase"
                    style={{
                      color: isDark
                        ? 'rgba(248, 250, 252, 0.96)'
                        : 'rgba(15, 23, 42, 0.92)',
                    }}
                  >
                    {toast.title}
                  </div>
                  <div
                    className="mt-1 text-sm leading-5 break-words"
                    style={{
                      color: isDark
                        ? 'rgba(226, 232, 240, 0.78)'
                        : 'rgba(51, 65, 85, 0.8)',
                    }}
                  >
                    {toast.subtitle}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}

export default HexagonServiceNetwork
