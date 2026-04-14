const fs = require('fs');
const path = require('path');
const { BrowserWindow } = require('electron');
const state = require('./state.cjs');

const isDev = process.env.ELECTRON_IS_DEV === '1';

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
  state.mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Random API Generator · CodeFryDev',
    backgroundColor: '#f8fafc',
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
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
