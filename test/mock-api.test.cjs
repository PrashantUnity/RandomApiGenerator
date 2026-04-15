const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateEndpointsConfig } = require('../electron/mock-api/validation.cjs');
const {
  parseListCount,
  normalizeEndpointsForRoutes,
  buildJsonArrayResponse,
  buildSingleObject,
} = require('../electron/mock-api/generator.cjs');
const { DEFAULT_LIST_COUNT } = require('../electron/mock-api/constants.cjs');

describe('validateEndpointsConfig', () => {
  it('rejects empty config', () => {
    const r = validateEndpointsConfig([]);
    assert.equal(r.ok, false);
  });

  it('accepts a minimal schema endpoint', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'users',
          schema: [{ name: 'id', type: 'integer' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, true);
  });

  it('rejects duplicate routes after sanitization', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'foo',
          schema: [{ name: 'a', type: 'string' }],
        },
        {
          path: 'foo',
          schema: [{ name: 'b', type: 'string' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
    assert.ok(String(r.error).includes('duplicate'));
  });

  it('allows same path with different methods', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'foo',
          method: 'GET',
          schema: [{ name: 'a', type: 'string' }],
        },
        {
          path: 'foo',
          method: 'POST',
          schema: [{ name: 'b', type: 'string' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, true);
  });

  it('rejects invalid JSON in sampleJson mode', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'x',
          responseMode: 'sampleJson',
          sampleJson: '{',
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
  });

  it('accepts sampleJson mode with object', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'widgets',
          responseMode: 'sampleJson',
          sampleJson: '{"a":1}',
        },
      ],
      'GET',
    );
    assert.equal(r.ok, true);
  });

  it('rejects empty example array in sampleJson mode', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'a',
          responseMode: 'sampleJson',
          sampleJson: '[]',
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
  });

  it('rejects invalid schema field name', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'p',
          schema: [{ name: 'bad-name', type: 'string' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
  });

  it('rejects named example body that is not an object or array', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'x',
          responseSource: 'example',
          examples: [{ name: 'a', body: '"hi"' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
  });

  it('rejects empty array in named example body', () => {
    const r = validateEndpointsConfig(
      [
        {
          path: 'x',
          responseSource: 'example',
          examples: [{ name: 'a', body: '[]' }],
        },
      ],
      'GET',
    );
    assert.equal(r.ok, false);
  });
});

describe('parseListCount', () => {
  it('uses DEFAULT_LIST_COUNT when query missing', () => {
    assert.equal(parseListCount({ query: {} }), DEFAULT_LIST_COUNT);
  });

  it('clamps to 1..500', () => {
    assert.equal(parseListCount({ query: { count: '0' } }), 1);
    assert.equal(parseListCount({ query: { count: '9999' } }), 500);
    assert.equal(parseListCount({ query: { count: '3' } }), 3);
  });

  it('falls back on NaN count', () => {
    assert.equal(parseListCount({ query: { count: 'nope' } }), DEFAULT_LIST_COUNT);
  });
});

describe('normalizeEndpointsForRoutes + buildJsonArrayResponse', () => {
  it('builds array rows from schema', () => {
    const raw = [
      {
        path: 'items',
        schema: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'string' },
        ],
      },
    ];
    const normalized = normalizeEndpointsForRoutes(raw, 'GET');
    assert.equal(normalized.length, 1);
    const rows = buildJsonArrayResponse(normalized[0], 2, { mockDataMode: 'seeded' });
    assert.equal(rows.length, 2);
    assert.ok(typeof rows[0].id !== 'undefined');
  });

  it('merge override in buildSingleObject for POST', () => {
    const raw = [
      {
        path: 'x',
        schema: [{ name: 'id', type: 'integer' }],
      },
    ];
    const ep = normalizeEndpointsForRoutes(raw, 'GET')[0];
    const one = buildSingleObject(ep, { extra: true }, { mockDataMode: 'seeded' });
    assert.equal(one.extra, true);
  });
});
