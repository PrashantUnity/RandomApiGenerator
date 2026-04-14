import { useCallback, useEffect, useRef, useState } from 'react'
import type { EndpointConfig, MockDataMode, ServerStatusPayload, StartServerResult } from '../types'
import { getElectronApi } from '../electronBridge'

export function useMockServerControls(
  electron: ReturnType<typeof getElectronApi>,
  flatEndpoints: EndpointConfig[],
  mockDataMode: MockDataMode,
) {
  const [server, setServer] = useState<ServerStatusPayload>({ status: 'stopped' })
  const [busy, setBusy] = useState(false)
  const [lastKnownBaseUrl, setLastKnownBaseUrl] = useState('')
  const flatEndpointsRef = useRef(flatEndpoints)
  flatEndpointsRef.current = flatEndpoints
  const serverRef = useRef(server)
  serverRef.current = server

  useEffect(() => {
    if (!electron) return
    const off = electron.onServerStatus((data) => setServer(data))
    return off
  }, [electron])

  useEffect(() => {
    if (server.status === 'running' && server.baseUrl) {
      setLastKnownBaseUrl(server.baseUrl)
    }
  }, [server])

  const handleStart = useCallback(async () => {
    if (!electron) return
    setBusy(true)
    try {
      const result: StartServerResult = await electron.startServer({
        endpoints: flatEndpointsRef.current,
        mockDataMode,
      })
      if (result.status === 'error') {
        setServer({ status: 'error', error: result.error ?? 'Unknown error' })
      } else {
        setServer({
          status: 'running',
          port: result.port,
          baseUrl: result.baseUrl,
        })
      }
    } finally {
      setBusy(false)
    }
  }, [electron, mockDataMode])

  const handleStop = useCallback(async () => {
    if (!electron) return
    setBusy(true)
    try {
      await electron.stopServer()
      setServer({ status: 'stopped' })
    } finally {
      setBusy(false)
    }
  }, [electron])

  /** Call after updating `mockDataMode` in app state to restart the mock server with the new mode. */
  const restartServerIfRunningWithMode = useCallback((mode: MockDataMode) => {
    const el = getElectronApi()
    if (el && serverRef.current.status === 'running') {
      void el.startServer({
        endpoints: flatEndpointsRef.current,
        mockDataMode: mode,
      })
    }
  }, [])

  return {
    server,
    setServer,
    busy,
    lastKnownBaseUrl,
    handleStart,
    handleStop,
    restartServerIfRunningWithMode,
  }
}
