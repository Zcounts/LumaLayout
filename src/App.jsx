import React, { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import LabelEditor from './components/LabelEditor'
import NewProjectDialog from './components/NewProjectDialog'

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

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)

  // Stable refs so IPC callbacks always use latest values
  const exportDataRef = useRef(exportData)
  const importDataRef = useRef(importData)
  const currentFilePathRef = useRef(currentFilePath)
  const projectNameRef = useRef(projectName)
  const setCurrentFilePathRef = useRef(setCurrentFilePath)
  const addRecentProjectRef = useRef(addRecentProject)

  useEffect(() => { exportDataRef.current = exportData }, [exportData])
  useEffect(() => { importDataRef.current = importData }, [importData])
  useEffect(() => { currentFilePathRef.current = currentFilePath }, [currentFilePath])
  useEffect(() => { projectNameRef.current = projectName }, [projectName])
  useEffect(() => { setCurrentFilePathRef.current = setCurrentFilePath }, [setCurrentFilePath])
  useEffect(() => { addRecentProjectRef.current = addRecentProject }, [addRecentProject])

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
        const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(result.filePath, name)
      }
    })

    const removeSaveAs = window.electronAPI.onMenuSaveAs(async () => {
      const data = exportDataRef.current()
      const result = await window.electronAPI.saveFile({ data })
      if (result?.success && result.filePath) {
        setCurrentFilePathRef.current(result.filePath)
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

    return () => {
      removeUndo?.()
      removeRedo?.()
      removeNewProject?.()
      removeSave?.()
      removeSaveAs?.()
      removeOpenFile?.()
    }
  }, [undo, redo])

  const handleNewProjectConfirm = (name) => {
    newProject(name)
    setShowNewProjectDialog(false)
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
    </div>
  )
}
