export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function wrapAngle(angle: number) {
  const wrappedAngle = (angle + Math.PI) % (Math.PI * 2)
  return wrappedAngle < 0 ? wrappedAngle + Math.PI : wrappedAngle - Math.PI
}

export function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

export function getSteppedMotionLevel(focusLevel: number) {
  const clampedFocus = clamp(focusLevel, 0, 1)

  if (clampedFocus <= 0.28) {
    return 0.12 * easeInOutCubic(clampedFocus / 0.28)
  }

  if (clampedFocus <= 0.68) {
    return 0.12 + 0.38 * easeInOutCubic((clampedFocus - 0.28) / 0.4)
  }

  return 0.5 + 0.5 * easeInOutCubic((clampedFocus - 0.68) / 0.32)
}

export function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function withOpacity(template: string, opacity: number) {
  return template.replace('VAL', String(clamp(opacity, 0, 1)))
}
