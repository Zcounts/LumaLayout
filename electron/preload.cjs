const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe, minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // File operations (to be expanded in Session 5)
  onMenuNew: (cb) => ipcRenderer.on('menu-new', cb),
  onMenuOpen: (cb) => ipcRenderer.on('menu-open', cb),
  onMenuSave: (cb) => ipcRenderer.on('menu-save', cb),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})
