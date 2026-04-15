const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const state = require('./state.cjs');

const isDev = process.env.ELECTRON_IS_DEV === '1';

/** First existing path wins; Windows needs .ico for taskbar/titlebar, macOS prefers .icns. */
function resolveWindowIconPath() {
  const names =
    process.platform === 'win32'
      ? ['icon.ico', 'icon.png']
      : process.platform === 'darwin'
        ? ['icon.icns', 'icon.png']
        : ['icon.png'];

  const searchDirs = [];
  if (isDev) {
    searchDirs.push(path.join(__dirname, '..', 'build'));
  } else {
    // `build/` is not inside app.asar; electron-builder copies these via extraResources → resources/app-icons.
    searchDirs.push(path.join(process.resourcesPath, 'app-icons'));
    searchDirs.push(path.join(app.getAppPath(), 'build'));
  }

  for (const dir of searchDirs) {
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

function createWindow() {
  const iconPath = resolveWindowIconPath();
  state.mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Random API Generator · CodeFryDev',
    backgroundColor: '#f8fafc',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    state.mainWindow.loadURL('http://127.0.0.1:5173');
    state.mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    state.mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  state.mainWindow.on('closed', () => {
    state.mainWindow = null;
  });
}

module.exports = { createWindow, isDev };
