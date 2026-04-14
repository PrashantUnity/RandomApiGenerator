import type { MockDataMode, SchemaField, SchemaFieldType } from './types'
import {
  buildExampleRowForSchema,
  exampleValueForType as mockExampleValue,
} from './mockFieldValuesPreview'

const FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Example values for one row — matches server-side faker helpers. */
export function exampleValueForType(
  type: SchemaFieldType,
  index: number,
  mockDataMode: MockDataMode = 'seeded',
): unknown {
  return mockExampleValue(type, index, mockDataMode)
}

/** Pretty-printed flat object JSON from the field list (stays in sync with the table). */
export function schemaToFormattedSampleJson(
  schema: SchemaField[],
  mockDataMode: MockDataMode = 'seeded',
): string {
  const obj = buildExampleRowForSchema(schema, mockDataMode)
  return JSON.stringify(obj, null, 2)
}

function inferTypeFromValue(v: unknown): SchemaFieldType {
  if (v === null) return 'string'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') {
    return Number.isInteger(v) ? 'integer' : 'float'
  }
  if (typeof v === 'string') {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email'
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    ) {
      return 'uuid'
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return 'date'

    try {
      const u = new URL(v)
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        if (u.hostname === 'picsum.photos') return 'picsum'
        return 'url'
      }
    } catch {
      /* not a URL */
    }

    if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(v) && v.length <= 80 && !/\s/.test(v)) {
      return 'slug'
    }

    if (/\blorem\b/i.test(v)) {
      const dotCount = (v.match(/\./g) ?? []).length
      if (v.length > 120 || dotCount >= 2) return 'lorem_paragraph'
      return 'lorem'
    }

    if (v.length < 48) return 'name'
    return 'string'
  }
  return 'string'
}

function isFlatPrimitive(v: unknown): boolean {
  if (v === null) return true
  const t = typeof v
  return t === 'string' || t === 'number' || t === 'boolean'
}

/**
 * If the JSON is a flat object (or a non-empty array whose first element is a flat object),
 * returns inferred schema. Nested objects/arrays in values return null.
 */
export function tryInferFlatSchemaFromSampleJson(text: string): SchemaField[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  let obj: Record<string, unknown>
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return null
    const first = parsed[0]
    if (first === null || typeof first !== 'object' || Array.isArray(first)) return null
    obj = first as Record<string, unknown>
  } else if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    obj = parsed as Record<string, unknown>
  } else {
    return null
  }
  const keys = Object.keys(obj)
  if (keys.length === 0) return null
  for (const k of keys) {
    if (!FIELD_NAME_RE.test(k)) return null
    if (!isFlatPrimitive(obj[k])) return null
  }
  return keys.map((name) => ({
    name,
    type: inferTypeFromValue(obj[name]),
  }))
}
