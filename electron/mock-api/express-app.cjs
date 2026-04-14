const express = require('express');
const cors = require('cors');
const { sanitizePathSegment } = require('./sanitize.cjs');
const { buildJsonArrayResponse, buildSingleObject, parseListCount } = require('./generator.cjs');

function buildExpressApp(normalizedEndpoints, serverOptions = {}) {
  const mockDataMode = serverOptions.mockDataMode === 'random' ? 'random' : 'seeded';
  const genOpts = { mockDataMode };

  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json({ limit: '1mb' }));

  for (const endpoint of normalizedEndpoints) {
    const routePath = `/${sanitizePathSegment(endpoint.path)}`;

    apiApp.get(routePath, (req, res) => {
      const count = parseListCount(req);
      res.json(buildJsonArrayResponse(endpoint, count, genOpts));
    });

    apiApp.head(routePath, (req, res) => {
      const count = parseListCount(req);
      const data = buildJsonArrayResponse(endpoint, count, genOpts);
      const json = JSON.stringify(data);
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Content-Length', Buffer.byteLength(json, 'utf8'));
      res.end();
    });

    apiApp.post(routePath, (req, res) => {
      const body = req.body;
      const merge =
        body && typeof body === 'object' && !Array.isArray(body) ? body : undefined;
      res.status(201).json(buildSingleObject(endpoint, merge, genOpts));
    });

    const putOrPatch = (req, res) => {
      const body = req.body;
      const merge =
        body && typeof body === 'object' && !Array.isArray(body) ? body : undefined;
      res.status(200).json(buildSingleObject(endpoint, merge, genOpts));
    };
    apiApp.put(routePath, putOrPatch);
    apiApp.patch(routePath, putOrPatch);

    apiApp.delete(routePath, (_req, res) => {
      res.status(204).end();
    });
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
