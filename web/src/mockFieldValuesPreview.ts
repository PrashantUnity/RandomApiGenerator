/**
 * Browser-side mock value helpers for schema preview only.
 * Keep in sync with `shared/mockFieldValues.cjs` when changing generation rules.
 */
import { faker } from '@faker-js/faker'
import type { MockDataMode, SchemaField, SchemaFieldType } from './types'

const PREVIEW_RANDOM_SEED = 0xdec0ded

function rowSeed(mode: MockDataMode, rowIndex: number, requestSeed: number): number {
  if (mode === 'seeded') {
    return rowIndex >>> 0
  }
  return ((requestSeed + rowIndex * 1000003) >>> 0) || 1
}

function picsumSeed(rowIndex: number, mode: MockDataMode, requestSeed: number): number {
  if (mode === 'seeded') return rowIndex
  return (requestSeed + rowIndex * 17) % 1000000
}

function valueForSchemaType(type: string): unknown {
  switch (type) {
    case 'string':
      return faker.lorem.words({ min: 2, max: 5 })
    case 'number':
      return faker.number.int({ min: 1, max: 1000000 })
    case 'integer':
      return faker.number.int({ min: 1, max: 1000000 })
    case 'float':
      return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 })
    case 'boolean':
      return faker.datatype.boolean()
    case 'email':
      return faker.internet.email()
    case 'uuid':
      return faker.string.uuid()
    case 'date':
      return faker.date.recent({ days: 30 }).toISOString()
    case 'name':
      return faker.person.fullName()
    case 'lorem':
      return faker.lorem.sentence()
    case 'lorem_paragraph':
      return faker.lorem.paragraph()
    case 'slug':
      return faker.lorem.slug()
    case 'url':
      return faker.internet.url()
    default:
      return faker.lorem.words({ min: 1, max: 3 })
  }
}

function buildSchemaRow(
  schema: SchemaField[],
  rowIndex: number,
  options: { mode: MockDataMode; requestSeed: number },
): Record<string, unknown> {
  const { mode, requestSeed } = options
  faker.seed(rowSeed(mode, rowIndex, requestSeed))
  const row: Record<string, unknown> = {}
  for (const field of schema) {
    if (field.type === 'picsum') {
      const s = picsumSeed(rowIndex, mode, requestSeed)
      row[field.name] = `https://picsum.photos/seed/${s}/400/300`
    } else {
      row[field.name] = valueForSchemaType(field.type)
    }
  }
  return row
}

export function buildExampleRowForSchema(
  schema: SchemaField[],
  mode: MockDataMode,
  previewRandomSeed: number = PREVIEW_RANDOM_SEED,
): Record<string, unknown> {
  const requestSeed = mode === 'seeded' ? 0 : previewRandomSeed
  return buildSchemaRow(schema, 0, { mode, requestSeed })
}

export function exampleValueForType(
  type: SchemaFieldType,
  index: number,
  mode: MockDataMode,
): unknown {
  const requestSeed = mode === 'seeded' ? 0 : PREVIEW_RANDOM_SEED
  faker.seed(rowSeed(mode, index, requestSeed))
  if (type === 'picsum') {
    return `https://picsum.photos/seed/${picsumSeed(index, mode, requestSeed)}/400/300`
  }
  return valueForSchemaType(type)
}
