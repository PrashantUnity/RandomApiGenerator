export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const HTTP_METHODS: HttpMethod[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']

export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'email'
  | 'uuid'
  | 'date'
  | 'name'
  | 'lorem'
  | 'lorem_paragraph'
  | 'slug'
  | 'url'
  | 'picsum'

export interface SchemaField {
  name: string
  type: SchemaFieldType
}

export type EndpointResponseMode = 'schema' | 'sampleJson'

export interface EndpointConfig {
  path: string
  schema: SchemaField[]
  /** How to build mock responses. Defaults to `schema` when omitted. */
  responseMode?: EndpointResponseMode
  /** Example response body (JSON text); used when `responseMode` is `sampleJson`. */
  sampleJson?: string
}

export interface ServerStatusPayload {
  status: 'running' | 'stopped' | 'error'
  port?: number
  baseUrl?: string
  error?: string
}

export interface StartServerResult {
  status: 'running' | 'error'
  port?: number
  baseUrl?: string
  error?: string
}

/** How mock list/object values are generated for the mock HTTP server. */
export type MockDataMode = 'seeded' | 'random'

export const PERSIST_STATE_VERSION = 3 as const

export interface MockCollection {
  id: string
  name: string
  endpoints: EndpointConfig[]
}

export interface MockWorkspace {
  id: string
  name: string
  collections: MockCollection[]
}

/** Full app state persisted to SQLite (v2). */
export interface PersistedAppState {
  version: typeof PERSIST_STATE_VERSION
  workspaces: MockWorkspace[]
  selectedWorkspaceId: string
  selectedCollectionId: string
  selectedRouteIndex: number
  requestMethod: HttpMethod
  sampleCount: string
  mockDataMode: MockDataMode
}

export type LoadAppStateResult =
  | {
      ok: true
      data: PersistedAppState | null
      /** Shown once after hydrate (invalid DB row, missing DB, etc.). */
      warning?: string
      /** When true, skip auto-save; local SQLite could not be opened. */
      persistUnavailable?: boolean
    }
  | { ok: false; error: string }

export type SaveAppStateResult = { ok: true } | { ok: false; error: string }

export interface ResponseMeta {
  status: number
  statusText: string
  timeMs: number
  sizeBytes: number
}
