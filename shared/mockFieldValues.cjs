'use strict';

const { faker } = require('@faker-js/faker');

/** Stable seed for UI preview when mode is random (avoids re-render thrash). */
const PREVIEW_RANDOM_SEED = 0xdec0ded;

function rowSeed(mode, rowIndex, requestSeed) {
  if (mode === 'seeded') {
    return rowIndex >>> 0;
  }
  return ((requestSeed + rowIndex * 1000003) >>> 0) || 1;
}

function picsumSeed(rowIndex, mode, requestSeed) {
  if (mode === 'seeded') return rowIndex;
  return (requestSeed + rowIndex * 17) % 1000000;
}

/**
 * Generate one value for a schema field type after faker has been seeded for the row.
 */
function valueForSchemaType(type) {
  switch (type) {
    case 'string':
      return faker.lorem.words({ min: 2, max: 5 });
    case 'number':
      return faker.number.int({ min: 1, max: 1000000 });
    case 'integer':
      return faker.number.int({ min: 1, max: 1000000 });
    case 'float':
      return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'email':
      return faker.internet.email();
    case 'uuid':
      return faker.string.uuid();
    case 'date':
      return faker.date.recent({ days: 30 }).toISOString();
    case 'name':
      return faker.person.fullName();
    case 'lorem':
      return faker.lorem.sentence();
    case 'lorem_paragraph':
      return faker.lorem.paragraph();
    case 'slug':
      return faker.lorem.slug();
    case 'url':
      return faker.internet.url();
    default:
      return faker.lorem.words({ min: 1, max: 3 });
  }
}

/**
 * @param {Array<{ name: string, type: string }>} schema
 * @param {number} rowIndex
 * @param {{ mode: 'seeded' | 'random', requestSeed: number }} options
 */
function buildSchemaRow(schema, rowIndex, options) {
  const { mode, requestSeed } = options;
  faker.seed(rowSeed(mode, rowIndex, requestSeed));
  const row = {};
  for (const field of schema) {
    if (field.type === 'picsum') {
      const s = picsumSeed(rowIndex, mode, requestSeed);
      row[field.name] = `https://picsum.photos/seed/${s}/400/300`;
    } else {
      row[field.name] = valueForSchemaType(field.type);
    }
  }
  return row;
}

function isProbablyLoremText(s) {
  return /\blorem\b/i.test(s);
}

/**
 * Leaf generation after faker.seed() for this leaf.
 */
function generateLeafFromSample(sample, rowIndex, options) {
  if (sample === null) {
    return null;
  }
  const t = typeof sample;
  if (t === 'boolean') {
    return options.mode === 'seeded' ? rowIndex % 2 === 0 : faker.datatype.boolean();
  }
  if (t === 'number') {
    if (Number.isInteger(sample)) {
      return options.mode === 'seeded'
        ? rowIndex + 1
        : faker.number.int({ min: 1, max: 1000000 });
    }
    return options.mode === 'seeded'
      ? Math.round((rowIndex * 1.37 + 0.5) * 100) / 100
      : faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
  }
  if (t === 'string') {
    const s = sample;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
      return faker.internet.email();
    }
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    ) {
      return faker.string.uuid();
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      return faker.date.recent({ days: 30 }).toISOString();
    }
    if (s.length > 48) {
      if (isProbablyLoremText(s)) {
        const dotCount = (s.match(/\./g) ?? []).length;
        if (s.length > 120 || dotCount >= 2) {
          return faker.lorem.paragraph();
        }
        return faker.lorem.sentence();
      }
      if (/^https?:\/\//i.test(s)) {
        try {
          const u = new URL(s);
          if (u.hostname === 'picsum.photos') {
            const ps = picsumSeed(rowIndex, options.mode, options.requestSeed);
            return `https://picsum.photos/seed/${ps}/400/300`;
          }
          if (u.protocol === 'http:' || u.protocol === 'https:') {
            return faker.internet.url();
          }
        } catch {
          /* fall through */
        }
      }
      return faker.lorem.words({ min: 2, max: 6 });
    }
    return faker.person.fullName();
  }
  return String(sample);
}

function leafSeed(mode, rowIndex, requestSeed, leafId) {
  if (mode === 'seeded') {
    return rowIndex * 100000 + leafId * 1001;
  }
  return ((requestSeed + rowIndex * 10000 + leafId * 97) >>> 0) || 1;
}

function deepGenerateFromSample(node, rowIndex, depth, options, counterRef, maxDepth) {
  if (depth > maxDepth) {
    return null;
  }
  if (node === null) {
    return null;
  }
  const t = typeof node;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    const leafId = counterRef.n++;
    faker.seed(leafSeed(options.mode, rowIndex, options.requestSeed, leafId));
    return generateLeafFromSample(node, rowIndex, options);
  }
  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [];
    }
    return node.map((child, j) =>
      deepGenerateFromSample(child, rowIndex * 1000 + j, depth + 1, options, counterRef, maxDepth),
    );
  }
  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = deepGenerateFromSample(v, rowIndex, depth + 1, options, counterRef, maxDepth);
    }
    return out;
  }
  return null;
}

function generateRowsFromSampleJson(parsed, count, options, maxDepth) {
  const template = Array.isArray(parsed) ? parsed[0] : parsed;
  if (template === undefined) {
    return [];
  }
  return Array.from({ length: count }, (_, i) => {
    const counterRef = { n: 0 };
    return deepGenerateFromSample(template, i, 0, options, counterRef, maxDepth);
  });
}

/**
 * @param {Array<{ name: string, type: string }>} schema
 * @param {'seeded' | 'random'} mode
 * @param {number} [previewRandomSeed] — defaults to PREVIEW_RANDOM_SEED for stable random preview
 */
function buildExampleRowForSchema(schema, mode, previewRandomSeed = PREVIEW_RANDOM_SEED) {
  const requestSeed = mode === 'seeded' ? 0 : previewRandomSeed;
  return buildSchemaRow(schema, 0, { mode, requestSeed });
}

/**
 * @param {string} type
 * @param {number} index
 * @param {'seeded' | 'random'} mode
 */
function exampleValueForType(type, index, mode) {
  const requestSeed = mode === 'seeded' ? 0 : PREVIEW_RANDOM_SEED;
  faker.seed(rowSeed(mode, index, requestSeed));
  if (type === 'picsum') {
    return `https://picsum.photos/seed/${picsumSeed(index, mode, requestSeed)}/400/300`;
  }
  return valueForSchemaType(type);
}

module.exports = {
  PREVIEW_RANDOM_SEED,
  buildSchemaRow,
  buildExampleRowForSchema,
  exampleValueForType,
  generateRowsFromSampleJson,
  rowSeed,
};
