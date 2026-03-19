import type {
  AmbientCallAssignment,
  ClusterNodeLifecycle,
  ClusterNodeRole,
} from '@/lib/ambientCluster'

export type ColorKey =
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'red'
  | 'neutral'
  | 'rose'
  | 'teal'
  | 'cyan'
  | 'lime'
  | 'indigo'
  | 'orange'
  | 'slate'
  | 'coral'
  | 'blue'
export type ConnectionKind =
  | 'ingress'
  | 'loadBalancer'
  | 'service'
  | 'storage'
  | 'telemetry'

export type AppServiceGroup =
  | 'edge'
  | 'auth'
  | 'catalog'
  | 'basket'
  | 'checkout'
  | 'warehouse'

export interface AppServiceConfig {
  name: AppServiceGroup
  displayLabel: string
  labelPrefix: string
  color: ColorKey
  minReplicas: number
  baselineReplicas: [number, number]
  spikeReplicas: number
  maxReplicas: number
  trafficWeight: number
  layoutSeed: {
    x: number
    y: number
    z: number
  }
  centerX: number
  centerY: number
  centerZ: number
  downstream: AppServiceGroup[]
}

export interface ServiceNode {
  id: number
  role: ClusterNodeRole
  lifecycleState: ClusterNodeLifecycle
  acceptingTraffic: boolean
  scaleDownTarget?: boolean
  replacementLaunched?: boolean
  replacementFor?: string
  replicaGroup?: string
  instanceNumber?: number
  label: string
  color: ColorKey
  x: number
  y: number
  z: number
  targetX: number
  targetY: number
  targetZ: number
  velocityX: number
  velocityY: number
  velocityZ: number
  screenX: number
  screenY: number
  screenScale: number
  size: number
  pulse: number
  pulseSpeed: number
  statusSince: number
  bornAt: number
}

export interface Connection {
  id: number
  key: string
  fromNodeId: number
  toNodeId: number
  kind: ConnectionKind
  establishProgress: number
  isEstablished: boolean
  establishSpeed: number
  lastPacketTime: number
  packetInterval: number
}

export interface EventToast {
  id: number
  title: string
  subtitle: string
  mode: 'emergency' | 'recovery' | 'autoscale'
  accentColor: string
  duration: number
  shownAt: number
  exitingAt: number | null
}

export interface DataPacket {
  id: number
  connectionKey: string
  progress: number
  speed: number
  type: 'tcp' | 'udp'
  size: number
  direction: 1 | -1
}

export interface StatusIndicator {
  id: number
  anchorNodeId: number
  xOffset: number
  yOffset: number
  type: 'success' | 'warning' | 'failure'
  opacity: number
  scale: number
  startTime: number
  duration: number
  label?: string
}

export type OccupiedLayoutZone = {
  x: number
  y: number
  radius: number
}

export type OccupiedPanelZone = {
  x: number
  y: number
  width: number
  height: number
}

export type ServicePanelPlacementState = {
  x: number
  y: number
  width: number
  height: number
}

export type { AmbientCallAssignment }
