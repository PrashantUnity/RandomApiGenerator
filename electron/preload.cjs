const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadAppState: () => ipcRenderer.invoke('load-app-state'),
  saveAppState: (payload) => ipcRenderer.invoke('save-app-state', payload),
  startServer: (endpointsConfig) => ipcRenderer.invoke('start-server', endpointsConfig),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  onServerStatus: (callback) => {
    const handler = (_event, data) => {
      callback(data);
    };
    ipcRenderer.on('server-status', handler);
    return () => {
      ipcRenderer.removeListener('server-status', handler);
    };
  },
});
