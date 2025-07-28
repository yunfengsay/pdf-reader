const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openPDF: (callback) => ipcRenderer.on('open-pdf', callback),
  zoomIn: (callback) => ipcRenderer.on('zoom-in', callback),
  zoomOut: (callback) => ipcRenderer.on('zoom-out', callback),
  zoomReset: (callback) => ipcRenderer.on('zoom-reset', callback),
  saveHighlight: (highlight) => ipcRenderer.invoke('save-highlight', highlight),
  getHighlights: (file) => ipcRenderer.invoke('get-highlights', file),
  translateText: (text) => ipcRenderer.invoke('translate-text', text)
});