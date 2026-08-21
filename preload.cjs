const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  storeRead: () => ipcRenderer.invoke('store:read'),
  storeWrite: (patch) => ipcRenderer.invoke('store:write', patch),
  desktopGet: () => ipcRenderer.invoke('desktop:get'),
  desktopSet: (patch) => ipcRenderer.invoke('desktop:set', patch),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximizeToggle'),
  quit: () => ipcRenderer.invoke('window:quit'),
  copyText: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  onDesktopChanged: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_event, value) => handler(value);
    ipcRenderer.on('desktop:changed', listener);
    return () => ipcRenderer.removeListener('desktop:changed', listener);
  }
});
