const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'LumaLayout',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a1a2e',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Build application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('menu-new-project'),
        },
        { type: 'separator' },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(win, {
              filters: [{ name: 'LumaLayout Files', extensions: ['lumalayout'] }],
              properties: ['openFile'],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0]
              const data = fs.readFileSync(filePath, 'utf-8')
              app.addRecentDocument(filePath)
              win.webContents.send('menu-open-file', { path: filePath, data })
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu-save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win.webContents.send('menu-save-as'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => win.webContents.send('menu-undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => win.webContents.send('menu-redo') },
        { type: 'separator' },
        { label: 'Duplicate', accelerator: 'CmdOrCtrl+D', click: () => win.webContents.send('menu-duplicate') },
        { label: 'Delete', accelerator: 'Delete', click: () => win.webContents.send('menu-delete') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// IPC handlers for file operations
ipcMain.handle('save-file', async (event, { filePath, data }) => {
  try {
    if (filePath) {
      fs.writeFileSync(filePath, data, 'utf-8')
      app.addRecentDocument(filePath)
      return { success: true, filePath }
    } else {
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'LumaLayout Files', extensions: ['lumalayout'] }],
        defaultPath: 'untitled.lumalayout',
      })
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data, 'utf-8')
        app.addRecentDocument(result.filePath)
        return { success: true, filePath: result.filePath }
      }
      return { success: false }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'LumaLayout Files', extensions: ['lumalayout'] }],
    properties: ['openFile'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const data = fs.readFileSync(filePath, 'utf-8')
    app.addRecentDocument(filePath)
    return { success: true, filePath, data }
  }
  return { success: false }
})

// Auto-save to userData temp file
ipcMain.handle('auto-save', async (event, { data }) => {
  try {
    const autoSavePath = path.join(app.getPath('userData'), 'autosave.lumalayout')
    fs.writeFileSync(autoSavePath, data, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
