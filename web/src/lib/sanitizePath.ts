/** Mirrors [`electron/mock-api/sanitize.cjs`](electron/mock-api/sanitize.cjs) for client-side validation. */
export function sanitizePathSegment(raw: string): string {
  const s = raw.replace(/^\/+/, '').replace(/\.\./g, '').slice(0, 128)
  const safe = s
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return safe || 'data'
}
