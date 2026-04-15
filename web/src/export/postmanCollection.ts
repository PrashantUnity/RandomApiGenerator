import type { EndpointConfig, HttpMethod, MockCollection } from '../types'

const POSTMAN_SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'

function methodFor(ep: EndpointConfig, fallback: HttpMethod): HttpMethod {
  return ep.method ?? fallback
}

function protocolFromBaseUrl(defaultUrl: string): string {
  try {
    const u = new URL(defaultUrl)
    return u.protocol.replace(':', '') || 'http'
  } catch {
    return 'http'
  }
}

function buildUrlRaw(pathSeg: string, baseVar: string): { raw: string; host: string[]; path: string[] } {
  const clean = pathSeg.replace(/^\/+/, '')
  const raw = `{{${baseVar}}}/${clean}`
  const path = clean ? clean.split('/').filter(Boolean) : []
  return {
    raw,
    host: [`{{${baseVar}}}`],
    path,
  }
}

/**
 * Postman Collection v2.1 for the current collection's routes.
 */
export function buildPostmanCollectionV21(opts: {
  collection: MockCollection
  defaultMethod: HttpMethod
  /** Variable name for base URL (default `baseUrl`). */
  baseUrlVariableName?: string
  /** Default value shown in collection variables (e.g. http://127.0.0.1:1234). */
  baseUrlDefault?: string
}): Record<string, unknown> {
  const baseVar = opts.baseUrlVariableName ?? 'baseUrl'
  const baseDefault = opts.baseUrlDefault ?? 'http://127.0.0.1:0'
  const protocol = protocolFromBaseUrl(baseDefault)

  const items = opts.collection.endpoints.map((ep) => {
    const m = methodFor(ep, opts.defaultMethod)
    const pathSeg = ep.path.replace(/^\/+/, '')
    const url = buildUrlRaw(pathSeg, baseVar)
    const hasBody = m === 'POST' || m === 'PUT' || m === 'PATCH'
    return {
      name: `${m} /${pathSeg || ''}`,
      request: {
        method: m,
        header: hasBody ? [{ key: 'Content-Type', value: 'application/json' }] : [],
        body: hasBody
          ? {
              mode: 'raw',
              raw: '{}',
            }
          : undefined,
        url: {
          raw: url.raw,
          protocol,
          host: url.host,
          path: url.path.length ? url.path : [''],
        },
      },
    }
  })

  return {
    info: {
      name: opts.collection.name || 'RandomApiGenerator',
      schema: POSTMAN_SCHEMA,
    },
    variable: [{ key: baseVar, value: baseDefault }],
    item: items,
  }
}
