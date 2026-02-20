const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  onMenuNewProject: (cb) => ipcRenderer.on('menu-new-project', cb),
  onMenuOpenFile: (cb) => ipcRenderer.on('menu-open-file', (e, data) => cb(data)),
  onMenuSave: (cb) => ipcRenderer.on('menu-save', cb),
  onMenuUndo: (cb) => ipcRenderer.on('menu-undo', cb),
  onMenuRedo: (cb) => ipcRenderer.on('menu-redo', cb),
  onMenuDuplicate: (cb) => ipcRenderer.on('menu-duplicate', cb),
  onMenuDelete: (cb) => ipcRenderer.on('menu-delete', cb),
})
