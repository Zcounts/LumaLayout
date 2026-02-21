const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ---- Recent files (persisted to userData JSON) ----
function recentFilesPath() {
  return path.join(app.getPath('userData'), 'recent-files.json')
}

function loadRecentFiles() {
  try { return JSON.parse(fs.readFileSync(recentFilesPath(), 'utf-8')) } catch { return [] }
}

function saveRecentFile(filePath) {
  const name = path.basename(filePath, '.lumalayout')
  const entry = { path: filePath, name, date: Date.now() }
  const existing = loadRecentFiles().filter(f => f.path !== filePath)
  const updated = [entry, ...existing].slice(0, 8)
  try { fs.writeFileSync(recentFilesPath(), JSON.stringify(updated), 'utf-8') } catch {}
  return updated
}

// ---- Menu builder (called on startup and whenever recent files change) ----
function buildMenu(win, recentFiles) {
  const recent = recentFiles && recentFiles.length > 0
    ? recentFiles.map(entry => ({
        label: entry.name,
        sublabel: entry.path,
        click: () => {
          try {
            const data = fs.readFileSync(entry.path, 'utf-8')
            app.addRecentDocument(entry.path)
            win.webContents.send('menu-open-file', { path: entry.path, data })
          } catch {
            dialog.showErrorBox('Cannot Open File', `Could not read:\n${entry.path}`)
          }
        },
      }))
    : [{ label: 'No recent projects', enabled: false }]

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
              const updated = saveRecentFile(filePath)
              buildMenu(win, updated)
              win.webContents.send('menu-open-file', { path: filePath, data })
            }
          },
        },
        {
          label: 'Recent Projects',
          submenu: recent,
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
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export All Scenes as PDF...',
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => win.webContents.send('menu-export-all-pdf'),
            },
            {
              label: 'Export All Scenes as PNG...',
              click: () => win.webContents.send('menu-export-all-png'),
            },
          ],
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

function createWindow() {
  // Resolve ICON.png correctly in both dev and packaged modes
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'ICON.png')
    : path.join(__dirname, '../ICON.png')

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'LumaLayout',
    icon: iconPath,
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

  buildMenu(win, loadRecentFiles())
}

// ---- IPC handlers ----

ipcMain.handle('save-file', async (event, { filePath, data }) => {
  try {
    if (filePath) {
      fs.writeFileSync(filePath, data, 'utf-8')
      app.addRecentDocument(filePath)
      const updated = saveRecentFile(filePath)
      // Rebuild menu to reflect new recent entry
      const win = BrowserWindow.getFocusedWindow()
      if (win) buildMenu(win, updated)
      return { success: true, filePath }
    } else {
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'LumaLayout Files', extensions: ['lumalayout'] }],
        defaultPath: 'untitled.lumalayout',
      })
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data, 'utf-8')
        app.addRecentDocument(result.filePath)
        const updated = saveRecentFile(result.filePath)
        const win = BrowserWindow.getFocusedWindow()
        if (win) buildMenu(win, updated)
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
    const updated = saveRecentFile(filePath)
    const win = BrowserWindow.getFocusedWindow()
    if (win) buildMenu(win, updated)
    return { success: true, filePath, data }
  }
  return { success: false }
})

// Read a specific file by path (used internally)
ipcMain.handle('read-file', async (event, { filePath }) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    app.addRecentDocument(filePath)
    return { success: true, filePath, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
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

// Export a single binary file (PDF or PNG) — data is base64-encoded
ipcMain.handle('save-export', async (event, { base64Data, defaultName, filters }) => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters,
    })
    if (!result.canceled && result.filePath) {
      const buffer = Buffer.from(base64Data, 'base64')
      fs.writeFileSync(result.filePath, buffer)
      return { success: true, filePath: result.filePath }
    }
    return { success: false }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Export all scenes as individual PNG files into a user-chosen folder
ipcMain.handle('save-export-all-png', async (event, { files }) => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select folder to save PNG files',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths.length) return { success: false }
    const folder = result.filePaths[0]
    for (const file of files) {
      const buffer = Buffer.from(file.base64Data, 'base64')
      fs.writeFileSync(path.join(folder, file.name), buffer)
    }
    return { success: true, folder }
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
