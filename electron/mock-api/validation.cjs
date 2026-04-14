const {
  SAMPLE_JSON_MAX_CHARS,
  SAMPLE_JSON_MAX_DEPTH,
  SAMPLE_JSON_MAX_KEYS,
} = require('./constants.cjs');
const { sanitizePathSegment } = require('./sanitize.cjs');

function countJsonKeys(node, depth) {
  if (depth > SAMPLE_JSON_MAX_DEPTH) {
    return { ok: false, error: 'example response JSON is nested too deeply' };
  }
  if (node === null || typeof node !== 'object') {
    return { ok: true, count: 0 };
  }
  if (Array.isArray(node)) {
    let total = 0;
    for (const item of node) {
      const r = countJsonKeys(item, depth + 1);
      if (!r.ok) return r;
      total += r.count;
    }
    return { ok: true, count: total };
  }
  let total = Object.keys(node).length;
  if (total > SAMPLE_JSON_MAX_KEYS) {
    return { ok: false, error: 'example response has too many keys' };
  }
  for (const v of Object.values(node)) {
    const r = countJsonKeys(v, depth + 1);
    if (!r.ok) return r;
    total += r.count;
    if (total > SAMPLE_JSON_MAX_KEYS) {
      return { ok: false, error: 'example response has too many keys' };
    }
  }
  return { ok: true, count: total };
}

function validateEndpointsConfig(config) {
  if (!Array.isArray(config) || config.length === 0) {
    return { ok: false, error: 'endpoints must be a non-empty array' };
  }
  if (config.length > 50) {
    return { ok: false, error: 'too many endpoints' };
  }
  const seenRoutes = new Set();
  for (const ep of config) {
    if (!ep || typeof ep.path !== 'string') {
      return { ok: false, error: 'each endpoint needs a path string' };
    }
    const routeKey = sanitizePathSegment(ep.path);
    if (seenRoutes.has(routeKey)) {
      return {
        ok: false,
        error: `duplicate route after sanitization: "/${routeKey}" (paths collide when turned into a URL segment)`,
      };
    }
    seenRoutes.add(routeKey);
    const mode = ep.responseMode === 'sampleJson' ? 'sampleJson' : 'schema';
    if (mode === 'sampleJson') {
      if (typeof ep.sampleJson !== 'string' || ep.sampleJson.trim() === '') {
        return { ok: false, error: 'example response mode requires non-empty JSON text' };
      }
      if (ep.sampleJson.length > SAMPLE_JSON_MAX_CHARS) {
        return { ok: false, error: 'example response text is too large' };
      }
      let parsed;
      try {
        parsed = JSON.parse(ep.sampleJson);
      } catch {
        return { ok: false, error: 'invalid JSON in example response' };
      }
      if (parsed === null || typeof parsed !== 'object') {
        return { ok: false, error: 'example response must be a JSON object or array' };
      }
      if (Array.isArray(parsed) && parsed.length === 0) {
        return { ok: false, error: 'example response array must not be empty' };
      }
      const keyCheck = countJsonKeys(parsed, 0);
      if (!keyCheck.ok) {
        return { ok: false, error: keyCheck.error };
      }
    } else {
      if (!Array.isArray(ep.schema) || ep.schema.length === 0) {
        return { ok: false, error: 'each endpoint needs a non-empty schema' };
      }
      if (ep.schema.length > 100) {
        return { ok: false, error: 'schema too large' };
      }
      const seenFieldNames = new Set();
      for (const field of ep.schema) {
        if (!field || typeof field.name !== 'string' || typeof field.type !== 'string') {
          return { ok: false, error: 'schema fields need name and type' };
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
          return { ok: false, error: `invalid field name: ${field.name}` };
        }
        if (seenFieldNames.has(field.name)) {
          return { ok: false, error: `duplicate schema field name: ${field.name}` };
        }
        seenFieldNames.add(field.name);
      }
    }
  }
  return { ok: true };
}

module.exports = { countJsonKeys, validateEndpointsConfig };
