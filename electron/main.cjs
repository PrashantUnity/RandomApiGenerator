const { app, BrowserWindow, Menu } = require('electron');
const { openDb } = require('./db.cjs');
const state = require('./state.cjs');
const { createWindow, isDev } = require('./window.cjs');
const { registerAppStateHandlers } = require('./ipc/app-state.cjs');
const { registerServerHandlers } = require('./ipc/server.cjs');

// Windows: correct taskbar / shortcut grouping and notification branding (must match packaged app id).
if (process.platform === 'win32') {
  app.setAppUserModelId('com.randomapigenerator.app');
}

registerAppStateHandlers();
registerServerHandlers();

// In dev, skip the single-instance lock so a stray background Electron from a prior
// `npm run dev` does not cause this process to exit immediately (exit 0) and tear down Vite.
const gotLock = isDev || app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  if (!isDev) {
    app.on('second-instance', () => {
      if (state.mainWindow) {
        if (state.mainWindow.isMinimized()) state.mainWindow.restore();
        state.mainWindow.focus();
      }
    });
  }

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    try {
      state.appDb = openDb(app.getPath('userData'));
    } catch (e) {
      state.persistDbUnavailable = true;
      console.error('Failed to open SQLite database', e);
    }

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (state.mockServer) {
    try {
      state.mockServer.close();
    } catch {
      /* ignore */
    }
    state.mockServer = null;
  }
  if (state.appDb) {
    try {
      state.appDb.close();
    } catch {
      /* ignore */
    }
    state.appDb = null;
  }
});
