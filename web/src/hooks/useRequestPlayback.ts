import { useCallback, useMemo, useRef, useState } from 'react'
import type { HttpMethod, ResponseMeta, ServerStatusPayload } from '../types'
import { clampCountFromSampleInput } from '../requestHelpers'

function formatResponseBodyText(
  text: string,
  requestMethod: HttpMethod,
  resOk: boolean,
  status: number,
): string {
  if (!text.trim() && resOk) {
    if (requestMethod === 'HEAD') {
      return '(HEAD — no body; status and size are still valid.)'
    }
    if (status === 204) {
      return '(no content)'
    }
    return text
  }
  try {
    const json = JSON.parse(text) as unknown
    return JSON.stringify(json, null, 2)
  } catch {
    return text
  }
}

function isAbortError(e: unknown): boolean {
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') {
    return true
  }
  return e instanceof Error && e.name === 'AbortError'
}

export function useRequestPlayback() {
  const [preview, setPreview] = useState('')
  const [rawBody, setRawBody] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [responseMeta, setResponseMeta] = useState<ResponseMeta | null>(null)
  const [bodyView, setBodyView] = useState<'pretty' | 'raw'>('pretty')
  const [requestBody, setRequestBody] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const requestSeqRef = useRef(0)

  const resetResponse = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    requestSeqRef.current += 1
    setPreview('')
    setRawBody('')
    setFetchError('')
    setResponseMeta(null)
  }, [])

  const runFetch = useCallback(
    async (url: string, requestMethod: HttpMethod, showRequestBodyEditor: boolean) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      const mySeq = (requestSeqRef.current += 1)

      const init: RequestInit = { method: requestMethod, signal: ac.signal }
      const trimmed = requestBody.trim()
      if (showRequestBodyEditor && trimmed) {
        try {
          JSON.parse(trimmed)
        } catch {
          if (mySeq !== requestSeqRef.current) return
          setFetchError('Request body is not valid JSON')
          return
        }
        init.headers = { 'Content-Type': 'application/json' }
        init.body = trimmed
      }

      const t0 = performance.now()
      try {
        const res = await fetch(url, init)
        if (mySeq !== requestSeqRef.current) return
        const buf = await res.arrayBuffer()
        if (mySeq !== requestSeqRef.current) return
        const t1 = performance.now()
        const text = new TextDecoder().decode(buf)
        setRawBody(text)
        const formatted = formatResponseBodyText(text, requestMethod, res.ok, res.status)
        setPreview(formatted)
        setResponseMeta({
          status: res.status,
          statusText: res.statusText,
          timeMs: Math.round(t1 - t0),
          sizeBytes: buf.byteLength,
        })
        if (!res.ok) {
          setFetchError(`${res.status} ${res.statusText}`)
        } else {
          setFetchError('')
        }
      } catch (e) {
        if (isAbortError(e)) return
        if (mySeq !== requestSeqRef.current) return
        setFetchError(e instanceof Error ? e.message : String(e))
      }
    },
    [requestBody],
  )

  const sendRequest = useCallback(
    async (
      server: ServerStatusPayload,
      sampleCount: string,
      requestMethod: HttpMethod,
      showRequestBodyEditor: boolean,
      pathSegment: string,
    ) => {
      if (server.status !== 'running' || !server.baseUrl) return
      const path = pathSegment.replace(/^\/+/, '')
      const count = clampCountFromSampleInput(sampleCount)
      const base = `${server.baseUrl}/${path}`
      const url =
        requestMethod === 'GET' || requestMethod === 'HEAD'
          ? `${base}?count=${count}`
          : base

      resetResponse()
      await runFetch(url, requestMethod, showRequestBodyEditor)
    },
    [resetResponse, runFetch],
  )

  /** Any http(s) URL — does not require the local mock server. */
  const sendCustomUrlRequest = useCallback(
    async (rawUrl: string, requestMethod: HttpMethod, showRequestBodyEditor: boolean) => {
      const trimmed = rawUrl.trim()
      if (!trimmed) {
        setFetchError('Enter a URL')
        return
      }
      let parsed: URL
      try {
        parsed = new URL(trimmed)
      } catch {
        setFetchError('Invalid URL — include scheme, e.g. https://api.example.com/path')
        return
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setFetchError('Only http:// and https:// URLs are supported')
        return
      }

      resetResponse()
      await runFetch(parsed.href, requestMethod, showRequestBodyEditor)
    },
    [resetResponse, runFetch],
  )

  return useMemo(
    () => ({
      preview,
      rawBody,
      fetchError,
      responseMeta,
      bodyView,
      setBodyView,
      requestBody,
      setRequestBody,
      sendRequest,
      sendCustomUrlRequest,
      resetResponse,
    }),
    [
      preview,
      rawBody,
      fetchError,
      responseMeta,
      bodyView,
      requestBody,
      sendRequest,
      sendCustomUrlRequest,
      resetResponse,
    ],
  )
}
