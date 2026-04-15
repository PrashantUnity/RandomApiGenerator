import type { EndpointConfig, HttpMethod, SchemaField, SchemaFieldType } from '../types'
import { schemaToFormattedSampleJson } from '../schemaSync'

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head'])

function mapJsonSchemaType(t: unknown, format?: unknown): SchemaFieldType {
  if (t === 'integer') return 'integer'
  if (t === 'number') return 'float'
  if (t === 'boolean') return 'boolean'
  if (format === 'email') return 'email'
  if (format === 'uuid') return 'uuid'
  if (format === 'date' || format === 'date-time') return 'date'
  if (format === 'uri' || format === 'url') return 'url'
  return 'string'
}

function schemaToFields(schema: unknown): SchemaField[] | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null
  const s = schema as Record<string, unknown>
  if (s.type !== 'object' || !s.properties || typeof s.properties !== 'object') return null
  const props = s.properties as Record<string, unknown>
  const fields: SchemaField[] = []
  for (const [name, def] of Object.entries(props)) {
    if (!def || typeof def !== 'object' || Array.isArray(def)) continue
    const d = def as Record<string, unknown>
    const ft = mapJsonSchemaType(d.type, d.format)
    fields.push({ name, type: ft })
  }
  return fields.length ? fields : null
}

function exampleToFields(example: unknown): SchemaField[] | null {
  if (!example || typeof example !== 'object' || Array.isArray(example)) return null
  const o = example as Record<string, unknown>
  const fields: SchemaField[] = []
  for (const [name, v] of Object.entries(o)) {
    const t = typeof v
    const ft: SchemaFieldType =
      t === 'number'
        ? Number.isInteger(v as number)
          ? 'integer'
          : 'float'
        : t === 'boolean'
          ? 'boolean'
          : 'string'
    fields.push({ name, type: ft })
  }
  return fields.length ? fields : null
}

function responseSchemaFromOp(op: Record<string, unknown>): {
  fields: SchemaField[] | null
  sampleJson?: string
} {
  const responses = op.responses
  if (!responses || typeof responses !== 'object') return { fields: null }
  const res200 =
    (responses as Record<string, unknown>)['200'] ??
    (responses as Record<string, unknown>)['201'] ??
    Object.values(responses as Record<string, unknown>)[0]
  if (!res200 || typeof res200 !== 'object') return { fields: null }
  const content = (res200 as Record<string, unknown>).content as Record<string, unknown> | undefined
  if (!content || typeof content !== 'object') return { fields: null }
  const appJson = content['application/json'] as Record<string, unknown> | undefined
  if (!appJson) return { fields: null }
  const ex = appJson.example
  if (ex !== undefined) {
    const fields = exampleToFields(ex)
    if (fields) {
      return {
        fields,
        sampleJson: JSON.stringify(ex, null, 2),
      }
    }
  }
  const schema = appJson.schema
  const fields = schemaToFields(schema)
  return { fields }
}

export type OpenApiImportResult =
  | { ok: true; endpoints: EndpointConfig[] }
  | { ok: false; error: string }

/**
 * Subset import: flat object schemas or JSON examples in `application/json` responses.
 */
export function importOpenApiSubset(doc: unknown): OpenApiImportResult {
  if (!doc || typeof doc !== 'object') {
    return { ok: false, error: 'Invalid OpenAPI document' }
  }
  const d = doc as Record<string, unknown>
  if (typeof d.swagger === 'string' && /^2\./.test(d.swagger.trim())) {
    return { ok: false, error: 'Swagger 2.x is not supported; use OpenAPI 3.0.x or 3.1.x' }
  }
  if (typeof d.openapi !== 'string') {
    return { ok: false, error: 'OpenAPI 3.0.x / 3.1.x required (missing openapi field)' }
  }
  const oa = d.openapi.trim()
  if (!/^3\.0\./.test(oa) && !/^3\.1\./.test(oa)) {
    return { ok: false, error: 'Only OpenAPI 3.0.x / 3.1.x is supported for import' }
  }
  const paths = d.paths
  if (!paths || typeof paths !== 'object') {
    return { ok: false, error: 'Missing paths' }
  }

  const endpoints: EndpointConfig[] = []

  for (const [pathKey, pathItem] of Object.entries(paths as Record<string, unknown>)) {
    if (!pathItem || typeof pathItem !== 'object') continue
    const pi = pathItem as Record<string, unknown>
    for (const [method, op] of Object.entries(pi)) {
      if (!HTTP_METHODS.has(method)) continue
      if (!op || typeof op !== 'object') continue
      const mop = op as Record<string, unknown>
      const pathSeg = pathKey.replace(/^\//, '').replace(/\/$/, '') || ''
      const httpMethod = method.toUpperCase() as HttpMethod

      const { fields, sampleJson } = responseSchemaFromOp(mop)
      if (!fields) continue

      const ep: EndpointConfig = {
        path: pathSeg || 'resource',
        method: httpMethod,
        schema: fields,
        responseMode: sampleJson ? 'sampleJson' : 'schema',
        sampleJson: sampleJson ?? schemaToFormattedSampleJson(fields, 'seeded'),
      }
      endpoints.push(ep)
    }
  }

  if (endpoints.length === 0) {
    return {
      ok: false,
      error: 'No importable operations found (need object schema or example in JSON responses)',
    }
  }

  return { ok: true, endpoints }
}
