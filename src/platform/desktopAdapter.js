import { PlatformCommand } from './platformAdapter'

export function createDesktopAdapter(electronAPI) {
  const commandBindings = {
    [PlatformCommand.NEW_PROJECT]: electronAPI.onMenuNewProject,
    [PlatformCommand.OPEN_PROJECT]: electronAPI.onMenuOpenFile,
    [PlatformCommand.SAVE_PROJECT]: electronAPI.onMenuSave,
    [PlatformCommand.SAVE_PROJECT_AS]: electronAPI.onMenuSaveAs,
    [PlatformCommand.EXPORT_ALL_PDF]: electronAPI.onMenuExportAllPDF,
    [PlatformCommand.EXPORT_ALL_PNG]: electronAPI.onMenuExportAllPNG,
    [PlatformCommand.UNDO]: electronAPI.onMenuUndo,
    [PlatformCommand.REDO]: electronAPI.onMenuRedo,
    [PlatformCommand.DUPLICATE]: electronAPI.onMenuDuplicate,
    [PlatformCommand.DELETE]: electronAPI.onMenuDelete,
  }

  return {
    runtime: 'desktop',
    capabilities: {
      hasNativeMenus: true,
      persistentFilePaths: true,
      supportsAutosave: true,
      supportsAppCloseControl: true,
      supportsRevealInFolder: typeof electronAPI.revealInFolder === 'function',
    },

    onCommand(command, handler) {
      const subscribe = commandBindings[command]
      if (!subscribe) return () => {}
      return subscribe((payload) => handler(payload))
    },

    onBeforeClose(handler) {
      if (!electronAPI.onAppBeforeClose) return () => {}
      return electronAPI.onAppBeforeClose(handler)
    },

    async requestForceClose() {
      if (!electronAPI.forceCloseApp) return
      await electronAPI.forceCloseApp()
    },

    async saveProject({ filePath, data }) {
      return electronAPI.saveFile({ filePath, data })
    },

    async openProject() {
      return electronAPI.openFile()
    },

    async readProject(filePath) {
      return electronAPI.readFile({ filePath })
    },

    async autoSave(data) {
      return electronAPI.autoSave({ data })
    },

    async saveExportFile({ base64Data, defaultName, filters }) {
      return electronAPI.saveExport({ base64Data, defaultName, filters })
    },

    async saveExportFiles(files) {
      return electronAPI.saveExportAllPng({ files })
    },

    async revealInFolder(filePath) {
      if (!electronAPI.revealInFolder || !filePath) return { success: false }
      return electronAPI.revealInFolder({ filePath })
    },
  }
}
