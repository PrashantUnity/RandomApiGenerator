import { clampCountFromSampleInput } from '../requestHelpers'
import type { HttpMethod } from '../types'

/** Full request URL when the mock server is running. */
export function computeDisplayUrl(
  running: boolean,
  baseUrl: string,
  pathSegment: string,
  requestMethod: HttpMethod,
  sampleCount: string,
): string {
  if (!running || !baseUrl) return ''
  const base = `${baseUrl}/${pathSegment}`
  if (requestMethod === 'GET' || requestMethod === 'HEAD') {
    const count = clampCountFromSampleInput(sampleCount)
    return `${base}?count=${encodeURIComponent(String(count))}`
  }
  return base
}

/**
 * URL preview when the server is stopped: uses the last running base URL so the port
 * matches what the user saw after the previous Start (OS-assigned port).
 */
export function computePlaceholderUrl(
  baseWhenRunning: string,
  lastKnownBaseUrl: string,
  pathSegment: string,
  requestMethod: HttpMethod,
  sampleCount: string,
): string {
  const host = baseWhenRunning || lastKnownBaseUrl
  if (!host) return ''
  const base = `${host}/${pathSegment}`
  if (requestMethod === 'GET' || requestMethod === 'HEAD') {
    const count = clampCountFromSampleInput(sampleCount)
    return `${base}?count=${encodeURIComponent(String(count))}`
  }
  return base
}
