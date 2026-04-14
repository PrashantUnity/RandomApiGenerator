/// <reference types="vite/client" />

import type {
  EndpointConfig,
  LoadAppStateResult,
  MockDataMode,
  PersistedAppState,
  SaveAppStateResult,
  ServerStatusPayload,
  StartServerResult,
} from './types'

export type StartServerPayload =
  | EndpointConfig[]
  | { endpoints: EndpointConfig[]; mockDataMode?: MockDataMode }

declare global {
  interface Window {
    electronAPI?: {
      loadAppState: () => Promise<LoadAppStateResult>
      saveAppState: (state: PersistedAppState) => Promise<SaveAppStateResult>
      startServer: (config: StartServerPayload) => Promise<StartServerResult>
      stopServer: () => Promise<{ status: string }>
      onServerStatus: (callback: (data: ServerStatusPayload) => void) => () => void
    }
  }
}

export {}
