const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
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
