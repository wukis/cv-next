'use client'

import { useEffect, useState } from 'react'

import {
  type ClusterSnapshot,
  DEFAULT_CLUSTER_SNAPSHOT,
  NETWORK_CLUSTER_STATE_EVENT,
} from '@/lib/ambientCluster'

export function useAmbientClusterSnapshot() {
  const [snapshot, setSnapshot] = useState<ClusterSnapshot>(
    DEFAULT_CLUSTER_SNAPSHOT,
  )

  useEffect(() => {
    const handleClusterUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClusterSnapshot>
      if (customEvent.detail) {
        setSnapshot(customEvent.detail)
      }
    }

    window.addEventListener(NETWORK_CLUSTER_STATE_EVENT, handleClusterUpdate)
    return () =>
      window.removeEventListener(
        NETWORK_CLUSTER_STATE_EVENT,
        handleClusterUpdate,
      )
  }, [])

  return snapshot
}
