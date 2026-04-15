const { randomInt } = require('crypto');
const { SAMPLE_JSON_MAX_DEPTH, DEFAULT_LIST_COUNT } = require('./constants.cjs');
const { resolveEndpointMethod } = require('./validation.cjs');
const mock = require('../../shared/mockFieldValues.cjs');

function randomRequestSeed() {
  return randomInt(1, 2147483646);
}

/**
 * @param {unknown[]} config
 * @param {string} defaultMethod
 */
function normalizeEndpointsForRoutes(config, defaultMethod = 'GET') {
  return config.map((ep) => {
    const method = resolveEndpointMethod(ep, defaultMethod);
    const mode = ep.responseMode === 'sampleJson' ? 'sampleJson' : 'schema';
    const responseSource = ep.responseSource === 'example' ? 'example' : 'generated';
    const delayMs =
      ep.delayMs !== undefined && ep.delayMs !== null && Number.isFinite(Number(ep.delayMs))
        ? Math.min(120_000, Math.max(0, Number(ep.delayMs)))
        : 0;
    const httpStatus =
      ep.httpStatus !== undefined && ep.httpStatus !== null && Number.isFinite(Number(ep.httpStatus))
        ? Math.min(599, Math.max(100, Math.floor(Number(ep.httpStatus))))
        : undefined;
    const examples = Array.isArray(ep.examples)
      ? ep.examples.map((x) => ({
          name: typeof x?.name === 'string' ? x.name : 'Example',
          body: typeof x?.body === 'string' ? x.body : '{}',
        }))
      : [];
    const activeExampleIndex = Math.max(
      0,
      Math.min(
        examples.length > 0 ? examples.length - 1 : 0,
        Math.floor(Number(ep.activeExampleIndex ?? 0)),
      ),
    );

    const base = {
      path: ep.path,
      method,
      delayMs,
      httpStatus,
      responseSource,
      examples,
      activeExampleIndex,
    };

    if (mode === 'sampleJson') {
      let parsedSample;
      try {
        parsedSample = JSON.parse(ep.sampleJson);
      } catch {
        parsedSample = {};
      }
      return {
        ...base,
        mode: 'sampleJson',
        parsedSample,
      };
    }
    return {
      ...base,
      mode: 'schema',
      schema: ep.schema,
    };
  });
}

function parseListCount(req) {
  const raw = req.query.count;
  if (raw === undefined || raw === null || raw === '') {
    return Math.min(500, Math.max(1, DEFAULT_LIST_COUNT));
  }
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) {
    return Math.min(500, Math.max(1, DEFAULT_LIST_COUNT));
  }
  return Math.min(500, Math.max(1, n));
}

function defaultStatusForMethod(method) {
  switch (method) {
    case 'POST':
      return 201;
    case 'DELETE':
      return 204;
    default:
      return 200;
  }
}

function buildJsonArrayResponse(endpoint, count, options = {}) {
  const mode = options.mockDataMode === 'random' ? 'random' : 'seeded';
  const requestSeed = mode === 'random' ? randomRequestSeed() : 0;
  if (endpoint.mode === 'sampleJson') {
    return mock.generateRowsFromSampleJson(
      endpoint.parsedSample,
      count,
      { mode, requestSeed },
      SAMPLE_JSON_MAX_DEPTH,
    );
  }
  return Array.from({ length: count }, (_, i) =>
    mock.buildSchemaRow(endpoint.schema, i, { mode, requestSeed }),
  );
}

function buildSingleObject(endpoint, merge, options = {}) {
  const arr = buildJsonArrayResponse(endpoint, 1, options);
  const obj = arr[0] ?? {};
  if (merge && typeof merge === 'object' && !Array.isArray(merge)) {
    return { ...obj, ...merge };
  }
  return obj;
}

function parseExampleBody(endpoint) {
  if (!endpoint.examples?.length) return null;
  const idx = Math.min(
    endpoint.examples.length - 1,
    Math.max(0, Math.floor(Number(endpoint.activeExampleIndex ?? 0))),
  );
  const ex = endpoint.examples[idx];
  if (!ex) return null;
  try {
    return JSON.parse(ex.body);
  } catch {
    return null;
  }
}

module.exports = {
  normalizeEndpointsForRoutes,
  buildJsonArrayResponse,
  buildSingleObject,
  parseListCount,
  defaultStatusForMethod,
  parseExampleBody,
};
