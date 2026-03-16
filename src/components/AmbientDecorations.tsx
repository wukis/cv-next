'use client'

import dynamic from 'next/dynamic'

import DeferredBackground from '@/components/DeferredBackground'
import DeferredConsoleEasterEgg from '@/components/DeferredConsoleEasterEgg'
import DeferredLogTerminal from '@/components/DeferredLogTerminal'
import DeferredMetricWidgets from '@/components/DeferredMetricWidgets'
import { useAmbientClusterSnapshot } from '@/lib/ambientClusterClient'

const EmergencyCallOverlay = dynamic(
  () => import('@/components/EmergencyCallOverlay'),
  { ssr: false },
)

export default function AmbientDecorations() {
  const cluster = useAmbientClusterSnapshot()
  const shouldRenderEmergencyOverlay =
    cluster.focusMode === 'preview' || cluster.emergencyState !== 'normal'

  return (
    <>
      <DeferredBackground />
      <DeferredMetricWidgets />
      <DeferredLogTerminal />
      <DeferredConsoleEasterEgg />
      {shouldRenderEmergencyOverlay ? <EmergencyCallOverlay /> : null}
    </>
  )
}
