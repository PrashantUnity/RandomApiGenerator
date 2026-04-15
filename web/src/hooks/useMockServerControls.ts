import { useCallback, useEffect, useRef, useState } from 'react'
import type { EndpointConfig, HttpMethod, MockDataMode, ServerStatusPayload, StartServerResult } from '../types'
import { getElectronApi } from '../electronBridge'

export function useMockServerControls(
  electron: ReturnType<typeof getElectronApi>,
  flatEndpoints: EndpointConfig[],
  mockDataMode: MockDataMode,
  defaultMethod: HttpMethod,
) {
  const [server, setServer] = useState<ServerStatusPayload>({ status: 'stopped' })
  const [busy, setBusy] = useState(false)
  const [lastKnownBaseUrl, setLastKnownBaseUrl] = useState('')
  const flatEndpointsRef = useRef(flatEndpoints)
  flatEndpointsRef.current = flatEndpoints
  const serverRef = useRef(server)
  serverRef.current = server
  const defaultMethodRef = useRef(defaultMethod)
  defaultMethodRef.current = defaultMethod

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

  const applyStartResult = useCallback((result: StartServerResult) => {
    if (result.status === 'error') {
      setServer({ status: 'error', error: result.error ?? 'Unknown error' })
    } else {
      setServer({
        status: 'running',
        port: result.port,
        baseUrl: result.baseUrl,
      })
    }
  }, [])

  const handleStart = useCallback(async () => {
    if (!electron) return
    setBusy(true)
    try {
      const result: StartServerResult = await electron.startServer({
        endpoints: flatEndpointsRef.current,
        mockDataMode,
        defaultMethod: defaultMethodRef.current,
      })
      applyStartResult(result)
    } catch (e) {
      setServer({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }, [electron, mockDataMode, applyStartResult])

  const handleStop = useCallback(async () => {
    if (!electron) return
    setBusy(true)
    try {
      await electron.stopServer()
      setServer({ status: 'stopped' })
    } catch (e) {
      setServer({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }, [electron])

  /** Call after updating `mockDataMode` in app state to restart the mock server with the new mode. */
  const restartServerIfRunningWithMode = useCallback(
    async (mode: MockDataMode) => {
      const el = getElectronApi()
      if (!el || serverRef.current.status !== 'running') return
      setBusy(true)
      try {
        const result: StartServerResult = await el.startServer({
          endpoints: flatEndpointsRef.current,
          mockDataMode: mode,
          defaultMethod: defaultMethodRef.current,
        })
        applyStartResult(result)
      } catch (e) {
        setServer({
          status: 'error',
          error: e instanceof Error ? e.message : String(e),
        })
      } finally {
        setBusy(false)
      }
    },
    [applyStartResult],
  )

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
