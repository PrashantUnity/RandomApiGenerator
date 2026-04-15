import { describe, expect, it } from 'vitest'
import { importOpenApiSubset } from './openapiImport'

describe('importOpenApiSubset', () => {
  it('rejects Swagger 2.x', () => {
    const r = importOpenApiSubset({
      swagger: '2.0',
      paths: {
        '/x': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { id: { type: 'integer' } } },
                  },
                },
              },
            },
          },
        },
      },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/Swagger 2/i)
    }
  })

  it('rejects missing openapi field', () => {
    const r = importOpenApiSubset({
      paths: {
        '/a': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { id: { type: 'integer' } } },
                  },
                },
              },
            },
          },
        },
      },
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/openapi/i)
    }
  })

  it('accepts OpenAPI 3.0 with importable GET', () => {
    const r = importOpenApiSubset({
      openapi: '3.0.0',
      paths: {
        '/widgets': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.endpoints.length).toBeGreaterThanOrEqual(1)
      expect(r.endpoints[0].path).toBe('widgets')
    }
  })
})
