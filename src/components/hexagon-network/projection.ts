import { PERSPECTIVE } from './constants'

let cameraZoomOffset = 0

export function setCameraZoomOffset(value: number) {
  cameraZoomOffset = value
}

export function project3D(
  x: number,
  y: number,
  z: number,
  centerX: number,
  centerY: number,
  rotX: number,
  rotY: number,
) {
  const cosY = Math.cos(rotY)
  const sinY = Math.sin(rotY)
  const x1 = x * cosY - z * sinY
  const z1 = x * sinY + z * cosY

  const cosX = Math.cos(rotX)
  const sinX = Math.sin(rotX)
  const y1 = y * cosX - z1 * sinX
  const z2 = y * sinX + z1 * cosX

  const adjustedZ = z2 + cameraZoomOffset
  const depth = Math.max(PERSPECTIVE * 0.38, PERSPECTIVE + adjustedZ)
  const scale = PERSPECTIVE / depth
  return {
    screenX: centerX + x1 * scale,
    screenY: centerY + y1 * scale,
    scale,
    z: adjustedZ,
  }
}
