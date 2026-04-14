import { useCallback, useState } from 'react'
import type { EndpointConfig, HttpMethod, ResponseMeta, ServerStatusPayload } from '../types'
import { clampCountFromSampleInput } from '../requestHelpers'

export function useRequestPlayback() {
  const [preview, setPreview] = useState('')
  const [rawBody, setRawBody] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [responseMeta, setResponseMeta] = useState<ResponseMeta | null>(null)
  const [bodyView, setBodyView] = useState<'pretty' | 'raw'>('pretty')
  const [requestBody, setRequestBody] = useState('')

  const resetResponse = useCallback(() => {
    setPreview('')
    setRawBody('')
    setFetchError('')
    setResponseMeta(null)
  }, [])

  const sendRequest = useCallback(
    async (
      server: ServerStatusPayload,
      selected: EndpointConfig | undefined,
      sampleCount: string,
      requestMethod: HttpMethod,
      showRequestBodyEditor: boolean,
    ) => {
      if (server.status !== 'running' || !server.baseUrl || !selected) return
      const path = selected.path.replace(/^\/+/, '')
      const count = clampCountFromSampleInput(sampleCount)
      const base = `${server.baseUrl}/${path}`
      const url =
        requestMethod === 'GET' || requestMethod === 'HEAD'
          ? `${base}?count=${count}`
          : base

      resetResponse()

      const init: RequestInit = { method: requestMethod }
      const trimmed = requestBody.trim()
      if (showRequestBodyEditor && trimmed) {
        try {
          JSON.parse(trimmed)
        } catch {
          setFetchError('Request body is not valid JSON')
          return
        }
        init.headers = { 'Content-Type': 'application/json' }
        init.body = trimmed
      }

      const t0 = performance.now()
      try {
        const res = await fetch(url, init)
        const buf = await res.arrayBuffer()
        const t1 = performance.now()
        const text = new TextDecoder().decode(buf)
        setRawBody(text)
        let formatted = text
        if (!text.trim() && res.ok) {
          if (requestMethod === 'HEAD') {
            formatted = '(HEAD — no body; status and size are still valid.)'
          } else if (res.status === 204) {
            formatted = '(no content)'
          } else {
            formatted = text
          }
        } else {
          try {
            const json = JSON.parse(text) as unknown
            formatted = JSON.stringify(json, null, 2)
          } catch {
            formatted = text
          }
        }
        setPreview(formatted)
        setResponseMeta({
          status: res.status,
          statusText: res.statusText,
          timeMs: Math.round(t1 - t0),
          sizeBytes: buf.byteLength,
        })
        if (!res.ok) {
          setFetchError(`${res.status} ${res.statusText}`)
        }
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : String(e))
      }
    },
    [requestBody, resetResponse],
  )

  return {
    preview,
    rawBody,
    fetchError,
    responseMeta,
    bodyView,
    setBodyView,
    requestBody,
    setRequestBody,
    sendRequest,
    resetResponse,
  }
}
