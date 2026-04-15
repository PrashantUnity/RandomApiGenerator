import { useCallback, useMemo, useState } from 'react'
import type { HttpMethod } from '../types'
import { useRequestPlayback } from './useRequestPlayback'

export function useQueryApiClient() {
  const request = useRequestPlayback()
  const { sendCustomUrlRequest, requestBody, ...rest } = request
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const showBody = method === 'POST' || method === 'PUT' || method === 'PATCH'

  const send = useCallback(() => {
    void sendCustomUrlRequest(url, method, showBody)
  }, [sendCustomUrlRequest, url, method, showBody])

  const codeSpec = useMemo(() => {
    const trimmed = requestBody.trim()
    const jsonBody =
      showBody && trimmed.length > 0 ? trimmed : undefined
    return { method, url: url.trim() || '', jsonBody }
  }, [method, url, requestBody, showBody])

  return {
    ...rest,
    requestBody,
    method,
    setMethod,
    url,
    setUrl,
    showBody,
    send,
    codeSpec,
  }
}
