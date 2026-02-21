import React, { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import LabelEditor from './components/LabelEditor'
import NewProjectDialog from './components/NewProjectDialog'
import { exportAllScenesPDF, exportAllScenesPNG } from './exportUtils'

export default function App() {
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
  const getCurrentScene = useStore(s => s.getCurrentScene)
  const scenes = useStore(s => s.scenes)
  const isDirty = useStore(s => s.isDirty)
  const markSaved = useStore(s => s.markSaved)

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  // Stable refs so IPC callbacks always use latest values
  const exportDataRef = useRef(exportData)
  const importDataRef = useRef(importData)
  const currentFilePathRef = useRef(currentFilePath)
  const projectNameRef = useRef(projectName)
  const setCurrentFilePathRef = useRef(setCurrentFilePath)
  const addRecentProjectRef = useRef(addRecentProject)
  const getCurrentSceneRef = useRef(getCurrentScene)
  const scenesRef = useRef(scenes)
  const isDirtyRef = useRef(isDirty)
  const markSavedRef = useRef(markSaved)

  useEffect(() => { exportDataRef.current = exportData }, [exportData])
  useEffect(() => { importDataRef.current = importData }, [importData])
  useEffect(() => { currentFilePathRef.current = currentFilePath }, [currentFilePath])
  useEffect(() => { projectNameRef.current = projectName }, [projectName])
  useEffect(() => { setCurrentFilePathRef.current = setCurrentFilePath }, [setCurrentFilePath])
  useEffect(() => { addRecentProjectRef.current = addRecentProject }, [addRecentProject])
  useEffect(() => { getCurrentSceneRef.current = getCurrentScene }, [getCurrentScene])
  useEffect(() => { scenesRef.current = scenes }, [scenes])
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { markSavedRef.current = markSaved }, [markSaved])

  // Update window title
  useEffect(() => {
    const unsaved = currentFilePath ? '' : ' \u2022'
    document.title = `${projectName}${unsaved} \u2014 LumaLayout`
  }, [projectName, currentFilePath])

  // Auto-save every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!window.electronAPI) return
      const data = exportDataRef.current()
      window.electronAPI.autoSave({ data })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Wire up Electron menu events (once on mount)
  useEffect(() => {
    if (!window.electronAPI) return

    const removeUndo = window.electronAPI.onMenuUndo(() => undo())
    const removeRedo = window.electronAPI.onMenuRedo(() => redo())

    const removeNewProject = window.electronAPI.onMenuNewProject(() => {
      setShowNewProjectDialog(true)
    })

    const removeSave = window.electronAPI.onMenuSave(async () => {
      const data = exportDataRef.current()
      const filePath = currentFilePathRef.current
      const result = await window.electronAPI.saveFile({ filePath, data })
      if (result?.success && result.filePath) {
        setCurrentFilePathRef.current(result.filePath)
        markSavedRef.current()
        const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(result.filePath, name)
      }
    })

    const removeSaveAs = window.electronAPI.onMenuSaveAs(async () => {
      const data = exportDataRef.current()
      const result = await window.electronAPI.saveFile({ data })
      if (result?.success && result.filePath) {
        setCurrentFilePathRef.current(result.filePath)
        markSavedRef.current()
        const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(result.filePath, name)
      }
    })

    const removeOpenFile = window.electronAPI.onMenuOpenFile(({ data, path }) => {
      importDataRef.current(data, path || null)
      if (path) {
        const name = path.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(path, name)
      }
    })

    const removeExportAllPDF = window.electronAPI.onMenuExportAllPDF(async () => {
      try {
        const allScenes = scenesRef.current
        if (!allScenes?.length) return
        const base64Data = await exportAllScenesPDF(allScenes)
        const projectSafeName = (projectNameRef.current || 'project').replace(/[^a-z0-9_-]/gi, '_')
        await window.electronAPI.saveExport({
          base64Data,
          defaultName: `${projectSafeName}_all_scenes.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        })
      } catch (err) {
        console.error('Export all scenes PDF failed:', err)
      }
    })

    const removeExportAllPNG = window.electronAPI.onMenuExportAllPNG(async () => {
      try {
        const allScenes = scenesRef.current
        if (!allScenes?.length) return
        const files = await exportAllScenesPNG(allScenes)
        await window.electronAPI.saveExportAllPng({ files })
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
  }, [undo, redo])

  // Intercept window close — prompt when there are unsaved changes
  useEffect(() => {
    if (!window.electronAPI?.onAppBeforeClose) return
    const remove = window.electronAPI.onAppBeforeClose(() => {
      if (!isDirtyRef.current) {
        window.electronAPI.forceCloseApp()
      } else {
        setShowCloseDialog(true)
      }
    })
    return remove
  }, [])

  const handleNewProjectConfirm = (name) => {
    newProject(name)
    setShowNewProjectDialog(false)
  }

  // Save then close (used by the close dialog)
  const handleSaveAndClose = async () => {
    const data = exportDataRef.current()
    const filePath = currentFilePathRef.current
    const result = await window.electronAPI.saveFile({ filePath, data })
    if (result?.success && result.filePath) {
      setCurrentFilePathRef.current(result.filePath)
      markSavedRef.current()
      const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
      addRecentProjectRef.current(result.filePath, name)
      window.electronAPI.forceCloseApp()
    }
    // If the save dialog was cancelled, keep the app open
    setShowCloseDialog(false)
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mode indicator banner */}
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider pointer-events-none ${
            mode === 'blueprint'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {mode === 'blueprint' ? '⬡ Blueprint Mode' : '⚡ Lighting Mode'}
          </div>

          <Canvas />

          {/* Version / branding footer */}
          <div
            className="absolute bottom-2 left-3 text-xs font-mono pointer-events-none select-none"
            style={{ color: 'rgba(100,100,100,0.55)', zIndex: 10 }}
          >
            v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} ©fairlyOdd L.L.C. {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <ContextMenu />
      <LabelEditor />

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <NewProjectDialog
          onConfirm={handleNewProjectConfirm}
          onCancel={() => setShowNewProjectDialog(false)}
        />
      )}

      {/* Unsaved-changes close dialog */}
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
                onClick={() => window.electronAPI.forceCloseApp()}
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
