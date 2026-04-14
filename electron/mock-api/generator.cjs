const { randomInt } = require('crypto');
const { SAMPLE_JSON_MAX_DEPTH, DEFAULT_LIST_COUNT } = require('./constants.cjs');
const mock = require('../../shared/mockFieldValues.cjs');

function randomRequestSeed() {
  return randomInt(1, 2147483646);
}

function normalizeEndpointsForRoutes(config) {
  return config.map((ep) => {
    const mode = ep.responseMode === 'sampleJson' ? 'sampleJson' : 'schema';
    if (mode === 'sampleJson') {
      return {
        path: ep.path,
        mode: 'sampleJson',
        parsedSample: JSON.parse(ep.sampleJson),
      };
    }
    return {
      path: ep.path,
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

module.exports = {
  normalizeEndpointsForRoutes,
  buildJsonArrayResponse,
  buildSingleObject,
  parseListCount,
};
