const { contextBridge, ipcRenderer } = require('electron')

// Helper to register a listener and return a cleanup function
const on = (channel, cb) => {
  ipcRenderer.on(channel, cb)
  return () => ipcRenderer.removeListener(channel, cb)
}

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  readFile: (data) => ipcRenderer.invoke('read-file', data),
  autoSave: (data) => ipcRenderer.invoke('auto-save', data),
  saveExport: (data) => ipcRenderer.invoke('save-export', data),

  // Save multiple PNG files into a user-chosen folder
  saveExportAllPng: (data) => ipcRenderer.invoke('save-export-all-png', data),

  // Menu event listeners (each returns a cleanup function)
  onMenuNewProject: (cb) => on('menu-new-project', cb),
  onMenuOpenFile: (cb) => on('menu-open-file', (e, data) => cb(data)),
  onMenuSave: (cb) => on('menu-save', cb),
  onMenuSaveAs: (cb) => on('menu-save-as', cb),
  onMenuUndo: (cb) => on('menu-undo', cb),
  onMenuRedo: (cb) => on('menu-redo', cb),
  onMenuDuplicate: (cb) => on('menu-duplicate', cb),
  onMenuDelete: (cb) => on('menu-delete', cb),
  onMenuExportAllPDF: (cb) => on('menu-export-all-pdf', cb),
  onMenuExportAllPNG: (cb) => on('menu-export-all-png', cb),

  // Close-window lifecycle
  onAppBeforeClose: (cb) => on('app-before-close', cb),
  forceCloseApp: () => ipcRenderer.invoke('force-close-app'),
})
