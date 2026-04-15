import type { EndpointConfig, HttpMethod, MockCollection, SchemaField } from '../types'

function jsonSchemaForField(f: SchemaField): Record<string, unknown> {
  const t = f.type
  if (t === 'integer') return { type: 'integer' }
  if (t === 'float' || t === 'number') return { type: 'number' }
  if (t === 'boolean') return { type: 'boolean' }
  return { type: 'string' }
}

function schemaProperties(fields: SchemaField[]): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const required: string[] = []
  for (const f of fields) {
    props[f.name] = jsonSchemaForField(f)
    required.push(f.name)
  }
  return {
    type: 'object',
    properties: props,
    required: required.length ? required : undefined,
  }
}

function methodFor(ep: EndpointConfig, fallback: HttpMethod): HttpMethod {
  return ep.method ?? fallback
}

/** Default OpenAPI response key aligned with typical HTTP semantics (matches the local mock server). */
function responseEntryForMethod(
  m: string,
  content: Record<string, unknown>,
): Record<string, unknown> {
  if (m === 'post') {
    return {
      responses: {
        '201': {
          description: 'Created',
          content,
        },
      },
    }
  }
  if (m === 'delete') {
    void content
    return {
      responses: {
        '204': {
          description: 'No Content',
        },
      },
    }
  }
  return {
    responses: {
      '200': {
        description: 'OK',
        content,
      },
    },
  }
}

/**
 * OpenAPI 3.0.3 document for a single collection (paths are `/segment` style).
 */
export function buildOpenApiFromCollection(opts: {
  title: string
  collection: MockCollection
  defaultMethod: HttpMethod
}): Record<string, unknown> {
  const paths: Record<string, unknown> = {}

  for (const ep of opts.collection.endpoints) {
    const pathKey = `/${ep.path.replace(/^\/+/, '') || ''}`
    const m = methodFor(ep, opts.defaultMethod).toLowerCase()
    const mode = ep.responseMode === 'sampleJson' ? 'sampleJson' : 'schema'
    let content: Record<string, unknown>
    if (mode === 'sampleJson' && ep.sampleJson) {
      try {
        const ex = JSON.parse(ep.sampleJson)
        content = {
          'application/json': {
            schema: { type: Array.isArray(ex) ? 'array' : 'object' },
            example: ex,
          },
        }
      } catch {
        content = {
          'application/json': {
            schema: schemaProperties(ep.schema),
          },
        }
      }
    } else {
      content = {
        'application/json': {
          schema: schemaProperties(ep.schema),
        },
      }
    }

    const op = responseEntryForMethod(m, content)

    const existing = (paths[pathKey] as Record<string, unknown>) ?? {}
    paths[pathKey] = { ...existing, [m]: op }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: opts.title,
      version: '1.0.0',
    },
    paths,
  }
}
