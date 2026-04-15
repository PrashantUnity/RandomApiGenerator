const express = require('express');
const cors = require('cors');
const { sanitizePathSegment } = require('./sanitize.cjs');
const {
  buildJsonArrayResponse,
  buildSingleObject,
  parseListCount,
  defaultStatusForMethod,
  parseExampleBody,
} = require('./generator.cjs');

function delayMiddleware(ms) {
  return (req, res, next) => {
    const d = Math.max(0, Math.min(120_000, Number(ms) || 0));
    if (d > 0) {
      setTimeout(() => next(), d);
    } else {
      next();
    }
  };
}

function buildExpressApp(normalizedEndpoints, serverOptions = {}) {
  const mockDataMode = serverOptions.mockDataMode === 'random' ? 'random' : 'seeded';
  const genOpts = { mockDataMode };

  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json({ limit: '1mb' }));

  for (const endpoint of normalizedEndpoints) {
    const routePath = `/${sanitizePathSegment(endpoint.path)}`;
    const method = String(endpoint.method || 'GET').toUpperCase();
    const delayMs = endpoint.delayMs || 0;
    const useExample = endpoint.responseSource === 'example' && endpoint.examples?.length > 0;

    const sendExample = (req, res) => {
      const parsed = parseExampleBody(endpoint);
      const status = endpoint.httpStatus ?? defaultStatusForMethod(method);
      if (method === 'DELETE' && status === 204) {
        return res.status(204).end();
      }
      if (parsed === null) {
        return res.status(500).json({ error: 'invalid example body' });
      }
      if (method === 'GET' || method === 'HEAD') {
        const body = Array.isArray(parsed) ? parsed : [parsed];
        if (method === 'HEAD') {
          const json = JSON.stringify(body);
          res.status(status);
          res.set('Content-Type', 'application/json; charset=utf-8');
          res.set('Content-Length', Buffer.byteLength(json, 'utf8'));
          return res.end();
        }
        return res.status(status).json(body);
      }
      return res.status(status).json(parsed);
    };

    const sendGeneratedGet = (req, res) => {
      const count = parseListCount(req);
      const status = endpoint.httpStatus ?? 200;
      res.status(status).json(buildJsonArrayResponse(endpoint, count, genOpts));
    };

    const sendGeneratedHead = (req, res) => {
      const count = parseListCount(req);
      const data = buildJsonArrayResponse(endpoint, count, genOpts);
      const json = JSON.stringify(data);
      const status = endpoint.httpStatus ?? 200;
      res.status(status);
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Content-Length', Buffer.byteLength(json, 'utf8'));
      res.end();
    };

    const sendGeneratedPost = (req, res) => {
      const body = req.body;
      const merge =
        body && typeof body === 'object' && !Array.isArray(body) ? body : undefined;
      const status = endpoint.httpStatus ?? 201;
      res.status(status).json(buildSingleObject(endpoint, merge, genOpts));
    };

    const sendGeneratedPutPatch = (req, res) => {
      const body = req.body;
      const merge =
        body && typeof body === 'object' && !Array.isArray(body) ? body : undefined;
      const status = endpoint.httpStatus ?? 200;
      res.status(status).json(buildSingleObject(endpoint, merge, genOpts));
    };

    const sendGeneratedDelete = (_req, res) => {
      const status = endpoint.httpStatus ?? 204;
      res.status(status).end();
    };

    const finalHandler =
      useExample
        ? sendExample
        : method === 'GET'
          ? sendGeneratedGet
          : method === 'HEAD'
            ? sendGeneratedHead
            : method === 'POST'
              ? sendGeneratedPost
              : method === 'PUT' || method === 'PATCH'
                ? sendGeneratedPutPatch
                : method === 'DELETE'
                  ? sendGeneratedDelete
                  : (_req, res) => res.status(405).json({ error: 'method not allowed' });

    const lower = method.toLowerCase();
    if (lower === 'get') apiApp.get(routePath, delayMiddleware(delayMs), finalHandler);
    else if (lower === 'head') apiApp.head(routePath, delayMiddleware(delayMs), finalHandler);
    else if (lower === 'post') apiApp.post(routePath, delayMiddleware(delayMs), finalHandler);
    else if (lower === 'put') apiApp.put(routePath, delayMiddleware(delayMs), finalHandler);
    else if (lower === 'patch') apiApp.patch(routePath, delayMiddleware(delayMs), finalHandler);
    else if (lower === 'delete') apiApp.delete(routePath, delayMiddleware(delayMs), finalHandler);
  }

  apiApp.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'invalid JSON body' });
    }
    next(err);
  });

  return apiApp;
}

module.exports = { buildExpressApp };
