const state = require('../state.cjs');
const { DEFAULT_PORT } = require('./constants.cjs');
const { validateEndpointsConfig } = require('./validation.cjs');
const { normalizeEndpointsForRoutes } = require('./generator.cjs');
const { buildExpressApp } = require('./express-app.cjs');

function closeMockServer() {
  return new Promise((resolve) => {
    if (!state.mockServer) {
      resolve();
      return;
    }
    state.mockServer.close(() => {
      state.mockServer = null;
      resolve();
    });
  });
}

/**
 * @param {unknown} payload — `EndpointConfig[]` (legacy) or `{ endpoints: EndpointConfig[], mockDataMode?: 'seeded' | 'random' }`
 * @returns {Promise<{ status: string; port?: number; baseUrl?: string; error?: string }>}
 */
function startMockServer(payload) {
  const endpointsConfig = Array.isArray(payload) ? payload : payload?.endpoints;
  const mockDataMode =
    !Array.isArray(payload) && payload?.mockDataMode === 'random' ? 'random' : 'seeded';

  const v = validateEndpointsConfig(endpointsConfig);
  if (!v.ok) {
    return Promise.resolve({ status: 'error', error: v.error });
  }

  return closeMockServer().then(
    () =>
      new Promise((resolve) => {
        const normalized = normalizeEndpointsForRoutes(endpointsConfig);
        const apiApp = buildExpressApp(normalized, { mockDataMode });

        let settled = false;
        const finish = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        // Port 0 — OS assigns a free port (avoids EADDRINUSE when 4000 is taken).
        const server = apiApp.listen(0, '127.0.0.1', () => {
          state.mockServer = server;
          const addr = server.address();
          const port =
            addr && typeof addr === 'object' && 'port' in addr && typeof addr.port === 'number'
              ? addr.port
              : DEFAULT_PORT;
          const baseUrl = `http://127.0.0.1:${port}`;
          if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('server-status', {
              status: 'running',
              port,
              baseUrl,
            });
          }
          finish({ status: 'running', port, baseUrl });
        });

        server.once('error', (err) => {
          if (state.mockServer === server) state.mockServer = null;
          finish({ status: 'error', error: err.message });
        });
      }),
  );
}

module.exports = { closeMockServer, startMockServer };
