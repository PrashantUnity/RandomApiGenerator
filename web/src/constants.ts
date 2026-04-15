import type { SchemaFieldType } from './types'

export const CODEFRYDEV_URL = 'https://codefrydev.in'

/** `public/codefrydev-icon.svg` — must use BASE_URL so packaged Electron (`file://`) resolves correctly. */
export const CODEFRYDEV_ICON_URL = `${import.meta.env.BASE_URL}codefrydev-icon.svg`

export const DEFAULT_SAMPLE_COUNT = 3

export const FIELD_TYPES: SchemaFieldType[] = [
  'string',
  'number',
  'integer',
  'float',
  'boolean',
  'email',
  'uuid',
  'date',
  'name',
  'lorem',
  'lorem_paragraph',
  'slug',
  'url',
  'picsum',
]
