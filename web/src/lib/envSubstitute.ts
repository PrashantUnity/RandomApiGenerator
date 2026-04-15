/**
 * Replace `{{var}}` in a path segment. Missing variables become `_` so the mock path stays safe.
 */
export function substitutePathVars(path: string, variables: Record<string, string>): string {
  const trimmed = path.replace(/^\/+/, '')
  return trimmed.replace(/\{\{([^}]+)\}\}/g, (_, rawKey: string) => {
    const key = String(rawKey).trim()
    const v = variables[key]
    return v !== undefined && v !== '' ? v : '_'
  })
}

/** Merge `baseUrl` from running server into vars for exports when set. */
export function mergeBaseUrlVar(
  variables: Record<string, string>,
  baseUrl: string | undefined,
): Record<string, string> {
  if (!baseUrl) return { ...variables }
  return { ...variables, baseUrl }
}
