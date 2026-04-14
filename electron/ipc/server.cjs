const { ipcMain } = require('electron');
const state = require('../state.cjs');
const { closeMockServer, startMockServer } = require('../mock-api/server.cjs');

function registerServerHandlers() {
  ipcMain.handle('start-server', (_event, endpointsConfig) => startMockServer(endpointsConfig));

  ipcMain.handle('stop-server', async () => {
    await closeMockServer();
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.webContents.send('server-status', { status: 'stopped' });
    }
    return { status: 'stopped' };
  });
}

module.exports = { registerServerHandlers };
