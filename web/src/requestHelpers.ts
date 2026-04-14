import { DEFAULT_SAMPLE_COUNT } from './constants'

/** Clamps list size from UI input: empty or invalid → default; 0 → 1. */
export function clampCountFromSampleInput(
  sampleCount: string,
  defaultVal = DEFAULT_SAMPLE_COUNT,
): number {
  const trimmed = sampleCount.trim()
  if (trimmed === '') return defaultVal
  const n = parseInt(trimmed, 10)
  if (!Number.isFinite(n)) return defaultVal
  return Math.min(500, Math.max(1, n))
}
