import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import LabelEditor from './components/LabelEditor'
import NewProjectDialog from './components/NewProjectDialog'
import { exportAllScenesPDF, exportAllScenesPNG } from './exportUtils'
import { createPlatformAdapter, PlatformCommand } from './platform/platformAdapter'

export default function App() {
  const platform = useMemo(() => createPlatformAdapter(), [])

  const darkMode = useStore(s => s.darkMode)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const importData = useStore(s => s.importData)
  const exportData = useStore(s => s.exportData)
  const mode = useStore(s => s.mode)
  const projectName = useStore(s => s.projectName)
  const currentFilePath = useStore(s => s.currentFilePath)
  const setCurrentFilePath = useStore(s => s.setCurrentFilePath)
  const addRecentProject = useStore(s => s.addRecentProject)
  const newProject = useStore(s => s.newProject)
  const scenes = useStore(s => s.scenes)
  const isDirty = useStore(s => s.isDirty)
  const markSaved = useStore(s => s.markSaved)

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  // Stable refs so command callbacks always use latest values
  const exportDataRef = useRef(exportData)
  const importDataRef = useRef(importData)
  const currentFilePathRef = useRef(currentFilePath)
  const projectNameRef = useRef(projectName)
  const setCurrentFilePathRef = useRef(setCurrentFilePath)
  const addRecentProjectRef = useRef(addRecentProject)
  const scenesRef = useRef(scenes)
  const isDirtyRef = useRef(isDirty)
  const markSavedRef = useRef(markSaved)

  useEffect(() => { exportDataRef.current = exportData }, [exportData])
  useEffect(() => { importDataRef.current = importData }, [importData])
  useEffect(() => { currentFilePathRef.current = currentFilePath }, [currentFilePath])
  useEffect(() => { projectNameRef.current = projectName }, [projectName])
  useEffect(() => { setCurrentFilePathRef.current = setCurrentFilePath }, [setCurrentFilePath])
  useEffect(() => { addRecentProjectRef.current = addRecentProject }, [addRecentProject])
  useEffect(() => { scenesRef.current = scenes }, [scenes])
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { markSavedRef.current = markSaved }, [markSaved])

  const syncSavedPath = async (result) => {
    if (!result?.success || !result.filePath) return
    setCurrentFilePathRef.current(result.filePath)
    markSavedRef.current()
    const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
    addRecentProjectRef.current(result.filePath, name)
  }

  const saveProject = async ({ forceSaveAs = false } = {}) => {
    const data = exportDataRef.current()
    const filePath = forceSaveAs ? null : currentFilePathRef.current
    const result = await platform.saveProject({ filePath, data })
    await syncSavedPath(result)
    return result
  }

  // Update window title
  useEffect(() => {
    const unsaved = currentFilePath ? '' : ' •'
    document.title = `${projectName}${unsaved} — LumaLayout`
  }, [projectName, currentFilePath])

  // Auto-save every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = exportDataRef.current()
      platform.autoSave(data)
    }, 60000)
    return () => clearInterval(interval)
  }, [platform])

  // Wire up platform command events (once on mount)
  useEffect(() => {
    const removeUndo = platform.onCommand(PlatformCommand.UNDO, () => undo())
    const removeRedo = platform.onCommand(PlatformCommand.REDO, () => redo())

    const removeNewProject = platform.onCommand(PlatformCommand.NEW_PROJECT, () => {
      setShowNewProjectDialog(true)
    })

    const removeSave = platform.onCommand(PlatformCommand.SAVE_PROJECT, async () => {
      await saveProject()
    })

    const removeSaveAs = platform.onCommand(PlatformCommand.SAVE_PROJECT_AS, async () => {
      await saveProject({ forceSaveAs: true })
    })

    const removeOpenFile = platform.onCommand(PlatformCommand.OPEN_PROJECT, async (payload) => {
      if (payload?.data) {
        importDataRef.current(payload.data, payload.path || null)
        if (payload.path) {
          const name = payload.path.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
          addRecentProjectRef.current(payload.path, name)
        }
        return
      }

      const result = await platform.openProject()
      if (!result?.success || !result.data) return
      importDataRef.current(result.data, result.filePath || null)
      if (result.filePath) {
        const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(result.filePath, name)
      }
    })

    const removeExportAllPDF = platform.onCommand(PlatformCommand.EXPORT_ALL_PDF, async () => {
      try {
        const allScenes = scenesRef.current
        if (!allScenes?.length) return
        const base64Data = await exportAllScenesPDF(allScenes)
        const projectSafeName = (projectNameRef.current || 'project').replace(/[^a-z0-9_-]/gi, '_')
        const saveResult = await platform.saveExportFile({
          base64Data,
          defaultName: `${projectSafeName}_all_scenes.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        })
        if (saveResult?.filePath && platform.capabilities.supportsRevealInFolder) {
          await platform.revealInFolder(saveResult.filePath)
        }
      } catch (err) {
        console.error('Export all scenes PDF failed:', err)
      }
    })

    const removeExportAllPNG = platform.onCommand(PlatformCommand.EXPORT_ALL_PNG, async () => {
      try {
        const allScenes = scenesRef.current
        if (!allScenes?.length) return
        const files = await exportAllScenesPNG(allScenes)
        await platform.saveExportFiles(files)
      } catch (err) {
        console.error('Export all scenes PNG failed:', err)
      }
    })

    return () => {
      removeUndo?.()
      removeRedo?.()
      removeNewProject?.()
      removeSave?.()
      removeSaveAs?.()
      removeOpenFile?.()
      removeExportAllPDF?.()
      removeExportAllPNG?.()
    }
  }, [undo, redo, platform])

  // Intercept window close — prompt when there are unsaved changes
  useEffect(() => {
    if (!platform.capabilities.supportsAppCloseControl) return
    const remove = platform.onBeforeClose(() => {
      if (!isDirtyRef.current) {
        platform.requestForceClose()
      } else {
        setShowCloseDialog(true)
      }
    })
    return remove
  }, [platform])

  const handleNewProjectConfirm = (name) => {
    newProject(name)
    setShowNewProjectDialog(false)
  }

  // Save then close (used by the close dialog)
  const handleSaveAndClose = async () => {
    const result = await saveProject()
    if (result?.success) {
      await platform.requestForceClose()
    }
    // If the save dialog was cancelled, keep the app open
    setShowCloseDialog(false)
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider pointer-events-none ${
            mode === 'blueprint'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {mode === 'blueprint' ? '⬡ Blueprint Mode' : '⚡ Lighting Mode'}
          </div>

          <Canvas />

          <div
            className="absolute bottom-2 left-3 text-xs font-mono pointer-events-none select-none"
            style={{ color: 'rgba(100,100,100,0.55)', zIndex: 10 }}
          >
            v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} ©fairlyOdd L.L.C. {new Date().getFullYear()}
          </div>
        </div>
      </div>

      <ContextMenu />
      <LabelEditor />

      {showNewProjectDialog && (
        <NewProjectDialog
          onConfirm={handleNewProjectConfirm}
          onCancel={() => setShowNewProjectDialog(false)}
        />
      )}

      {showCloseDialog && (
        <div className="close-dialog-overlay">
          <div className="close-dialog">
            <h3>Unsaved Changes</h3>
            <p>
              <strong>{projectName}</strong> has unsaved changes.
              Do you want to save before closing?
            </p>
            <div className="close-dialog-buttons">
              <button
                className="close-dialog-btn"
                onClick={() => setShowCloseDialog(false)}
              >
                Cancel
              </button>
              <button
                className="close-dialog-btn"
                onClick={() => platform.requestForceClose()}
              >
                Don't Save
              </button>
              <button
                className="close-dialog-btn primary"
                onClick={handleSaveAndClose}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
