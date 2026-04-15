import { describe, expect, it } from 'vitest'
import type { EndpointConfig } from '../types'
import { validateEndpointsConfig } from './validateEndpointsConfig'

describe('validateEndpointsConfig (web)', () => {
  it('rejects merged list over 50 endpoints', () => {
    const eps: EndpointConfig[] = Array.from({ length: 51 }, (_, i) => ({
      path: `p${i}`,
      schema: [{ name: 'id', type: 'integer' }],
    }))
    const r = validateEndpointsConfig(eps, 'GET')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/too many endpoints/i)
  })

  it('rejects duplicate path and method after merge', () => {
    const eps: EndpointConfig[] = [
      { path: 'foo', schema: [{ name: 'a', type: 'string' }] },
      { path: 'foo', schema: [{ name: 'b', type: 'string' }] },
    ]
    const r = validateEndpointsConfig(eps, 'GET')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/duplicate route/i)
  })
})
