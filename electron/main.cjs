const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const DEFAULT_PORT = 4000;
const isDev = process.env.ELECTRON_IS_DEV === '1';

let mainWindow = null;
let mockServer = null;

function sanitizePathSegment(raw) {
  if (typeof raw !== 'string') return 'data';
  const s = raw.replace(/^\/+/, '').replace(/\.\./g, '').slice(0, 128);
  const safe = s.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe || 'data';
}

const SAMPLE_JSON_MAX_CHARS = 120000;
const SAMPLE_JSON_MAX_DEPTH = 40;
const SAMPLE_JSON_MAX_KEYS = 2000;

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
  for (const ep of config) {
    if (!ep || typeof ep.path !== 'string') {
      return { ok: false, error: 'each endpoint needs a path string' };
    }
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
      for (const field of ep.schema) {
        if (!field || typeof field.name !== 'string' || typeof field.type !== 'string') {
          return { ok: false, error: 'schema fields need name and type' };
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
          return { ok: false, error: `invalid field name: ${field.name}` };
        }
      }
    }
  }
  return { ok: true };
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

function generateLeafFromSample(sample, index) {
  if (sample === null) {
    return null;
  }
  const t = typeof sample;
  if (t === 'boolean') {
    return index % 2 === 0;
  }
  if (t === 'number') {
    if (Number.isInteger(sample)) {
      return index + 1;
    }
    return Math.round((index * 1.37 + 0.5) * 100) / 100;
  }
  if (t === 'string') {
    const s = sample;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
      return `user${index}@example.com`;
    }
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    ) {
      return randomUUID();
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      return new Date(Date.now() + index * 86400000).toISOString();
    }
    if (s.length > 48) {
      return `string_${index}`;
    }
    return `Name ${index}`;
  }
  return String(sample);
}

function deepGenerateFromSample(node, index, depth = 0) {
  if (depth > SAMPLE_JSON_MAX_DEPTH) {
    return null;
  }
  if (node === null) {
    return null;
  }
  const t = typeof node;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return generateLeafFromSample(node, index);
  }
  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [];
    }
    return node.map((child, j) => deepGenerateFromSample(child, index * 1000 + j, depth + 1));
  }
  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = deepGenerateFromSample(v, index, depth + 1);
    }
    return out;
  }
  return null;
}

function generateRowsFromSampleJson(parsed, count) {
  const template = Array.isArray(parsed) ? parsed[0] : parsed;
  if (template === undefined) {
    return [];
  }
  return Array.from({ length: count }, (_, i) => deepGenerateFromSample(template, i));
}

function generateValue(type, index) {
  switch (type) {
    case 'string':
      return `string_${index}`;
    case 'number':
      return index * 7 + 1;
    case 'integer':
      return index + 1;
    case 'float':
      return Math.round((index * 1.37 + 0.5) * 100) / 100;
    case 'boolean':
      return index % 2 === 0;
    case 'email':
      return `user${index}@example.com`;
    case 'uuid':
      return randomUUID();
    case 'date':
      return new Date(Date.now() + index * 86400000).toISOString();
    case 'name':
      return `Name ${index}`;
    default:
      return `value_${index}`;
  }
}

function closeMockServer() {
  return new Promise((resolve) => {
    if (!mockServer) {
      resolve();
      return;
    }
    mockServer.close(() => {
      mockServer = null;
      resolve();
    });
  });
}

function buildExpressApp(normalizedEndpoints) {
  const apiApp = express();
  apiApp.use(cors());

  for (const endpoint of normalizedEndpoints) {
    const routePath = `/${sanitizePathSegment(endpoint.path)}`;
    apiApp.get(routePath, (req, res) => {
      const count = Math.min(500, Math.max(1, parseInt(String(req.query.count), 10) || 10));
      if (endpoint.mode === 'sampleJson') {
        const data = generateRowsFromSampleJson(endpoint.parsedSample, count);
        res.json(data);
        return;
      }
      const data = Array.from({ length: count }).map((_, i) => {
        const row = {};
        for (const field of endpoint.schema) {
          row[field.name] = generateValue(field.type, i);
        }
        return row;
      });
      res.json(data);
    });
  }

  return apiApp;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Random API Generator · CodeFryDev',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// In dev, skip the single-instance lock so a stray background Electron from a prior
// `npm run dev` does not cause this process to exit immediately (exit 0) and tear down Vite.
const gotLock = isDev || app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  if (!isDev) {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

ipcMain.handle('start-server', async (_event, endpointsConfig) => {
  const v = validateEndpointsConfig(endpointsConfig);
  if (!v.ok) {
    return { status: 'error', error: v.error };
  }

  await closeMockServer();

  const normalized = normalizeEndpointsForRoutes(endpointsConfig);
  const apiApp = buildExpressApp(normalized);

  return new Promise((resolve) => {
    const server = apiApp.listen(DEFAULT_PORT, '127.0.0.1', () => {
      mockServer = server;
      const baseUrl = `http://127.0.0.1:${DEFAULT_PORT}`;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-status', {
          status: 'running',
          port: DEFAULT_PORT,
          baseUrl,
        });
      }
      resolve({ status: 'running', port: DEFAULT_PORT, baseUrl });
    });

    server.once('error', (err) => {
      if (mockServer === server) mockServer = null;
      resolve({ status: 'error', error: err.message });
    });
  });
});

ipcMain.handle('stop-server', async () => {
  await closeMockServer();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server-status', { status: 'stopped' });
  }
  return { status: 'stopped' };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (mockServer) {
    try {
      mockServer.close();
    } catch {
      /* ignore */
    }
    mockServer = null;
  }
});
