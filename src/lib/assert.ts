function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function getRequiredValue<T>(
  value: T | null | undefined,
  message: string,
): T {
  invariant(value !== null && value !== undefined, message)
  return value
}

export function getRequiredArrayItem<T>(
  items: readonly T[],
  index: number,
  message: string,
): T {
  return getRequiredValue(items[index], message)
}
