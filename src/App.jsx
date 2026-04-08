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
import { createProjectStorage } from './storage/projectStorage'
import { allScenesPdfFileName, projectFileName } from './platform/fileNames'

export default function App() {
  const platform = useMemo(() => createPlatformAdapter(), [])
  const projectStorage = useMemo(() => createProjectStorage(platform), [platform])

  const darkMode = useStore(s => s.darkMode)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const importData = useStore(s => s.importData)
  const exportData = useStore(s => s.exportData)
  const mode = useStore(s => s.mode)
  const projectName = useStore(s => s.projectName)
  const currentFilePath = useStore(s => s.currentFilePath)
  const currentStorageProjectId = useStore(s => s.currentStorageProjectId)
  const setCurrentFilePath = useStore(s => s.setCurrentFilePath)
  const setCurrentStorageProjectId = useStore(s => s.setCurrentStorageProjectId)
  const addRecentProject = useStore(s => s.addRecentProject)
  const newProject = useStore(s => s.newProject)
  const scenes = useStore(s => s.scenes)
  const isDirty = useStore(s => s.isDirty)
  const markSaved = useStore(s => s.markSaved)

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [status, setStatus] = useState(null)

  const showStatus = (text, kind = 'info') => {
    setStatus({ text, kind })
    setTimeout(() => setStatus(null), 2800)
  }

  const exportDataRef = useRef(exportData)
  const importDataRef = useRef(importData)
  const currentFilePathRef = useRef(currentFilePath)
  const currentStorageProjectIdRef = useRef(currentStorageProjectId)
  const projectNameRef = useRef(projectName)
  const setCurrentFilePathRef = useRef(setCurrentFilePath)
  const setCurrentStorageProjectIdRef = useRef(setCurrentStorageProjectId)
  const addRecentProjectRef = useRef(addRecentProject)
  const scenesRef = useRef(scenes)
  const isDirtyRef = useRef(isDirty)
  const markSavedRef = useRef(markSaved)

  useEffect(() => { exportDataRef.current = exportData }, [exportData])
  useEffect(() => { importDataRef.current = importData }, [importData])
  useEffect(() => { currentFilePathRef.current = currentFilePath }, [currentFilePath])
  useEffect(() => { currentStorageProjectIdRef.current = currentStorageProjectId }, [currentStorageProjectId])
  useEffect(() => { projectNameRef.current = projectName }, [projectName])
  useEffect(() => { setCurrentFilePathRef.current = setCurrentFilePath }, [setCurrentFilePath])
  useEffect(() => { setCurrentStorageProjectIdRef.current = setCurrentStorageProjectId }, [setCurrentStorageProjectId])
  useEffect(() => { addRecentProjectRef.current = addRecentProject }, [addRecentProject])
  useEffect(() => { scenesRef.current = scenes }, [scenes])
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { markSavedRef.current = markSaved }, [markSaved])

  const saveWorkingCopy = async () => {
    if (!projectStorage.supportsPersistentProjects) return null
    const data = exportDataRef.current()
    const name = projectNameRef.current || 'Untitled Project'
    const id = currentStorageProjectIdRef.current
    const result = await projectStorage.saveProject({ id, name, data })
    if (result?.success && result.id) {
      setCurrentStorageProjectIdRef.current(result.id)
      await projectStorage.setLastOpenedProjectId(result.id)
      return result.id
    }
    return null
  }

  const downloadProjectFile = async ({ forceSaveAs = false } = {}) => {
    const data = exportDataRef.current()
    const suggestedName = projectFileName(projectNameRef.current)
    const filePath = forceSaveAs ? null : currentFilePathRef.current
    const result = await platform.saveProject({ filePath, data, suggestedName, forceSaveAs })

    if (result?.success && result.filePath) {
      setCurrentFilePathRef.current(result.filePath)
      setCurrentStorageProjectIdRef.current(null)
      markSavedRef.current()
      const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
      addRecentProjectRef.current(result.filePath, name)
      showStatus('Project saved to file path.', 'success')
      return result
    }

    if (result?.success && platform.runtime === 'web') {
      markSavedRef.current()
      showStatus(
        result.method === 'file-system-access'
          ? `Project file saved: ${result.fileName}`
          : `Project file downloaded: ${result.fileName}`,
        'success',
      )
    }

    if (!result?.success && !result?.canceled) {
      showStatus('Project file save failed.', 'error')
    }

    return result
  }

  const openProjectFile = async (payload = null) => {
    if (payload?.data) {
      importDataRef.current(payload.data, payload.path || null)
      setCurrentStorageProjectIdRef.current(null)
      if (payload.path) {
        const name = payload.path.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
        addRecentProjectRef.current(payload.path, name)
      }
      showStatus('Project opened from file.', 'success')
      return
    }

    const result = await platform.openProject()
    if (!result?.success || !result.data) {
      if (!result?.canceled) showStatus('Open project failed.', 'error')
      return
    }

    importDataRef.current(result.data, result.filePath || null)
    setCurrentStorageProjectIdRef.current(null)
    if (result.filePath) {
      const name = result.filePath.split(/[\\/]/).pop().replace(/\.lumalayout$/i, '')
      addRecentProjectRef.current(result.filePath, name)
    }
    showStatus(
      result.method === 'file-system-access'
        ? `Project opened: ${result.fileName}`
        : 'Project imported from file.',
      'success',
    )
  }

  const exportAllPdf = async () => {
    const allScenes = scenesRef.current
    if (!allScenes?.length) return
    const base64Data = await exportAllScenesPDF(allScenes)
    const saveResult = await platform.saveExportFile({
      base64Data,
      defaultName: allScenesPdfFileName(projectNameRef.current),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (saveResult?.success) {
      showStatus(
        saveResult.method === 'file-system-access'
          ? `PDF exported: ${saveResult.fileName}`
          : 'PDF export downloaded.',
        'success',
      )
      if (saveResult?.filePath && platform.capabilities.supportsRevealInFolder) {
        await platform.revealInFolder(saveResult.filePath)
      }
    } else if (!saveResult?.canceled) {
      showStatus('PDF export failed.', 'error')
    }
  }

  const exportAllPng = async () => {
    const allScenes = scenesRef.current
    if (!allScenes?.length) return
    const files = await exportAllScenesPNG(allScenes)
    const saveResult = await platform.saveExportFiles(files)

    if (saveResult?.success) {
      showStatus(
        saveResult.method === 'directory-picker'
          ? 'PNG exports saved to selected folder.'
          : 'PNG exports downloaded.',
        'success',
      )
    } else if (!saveResult?.canceled) {
      showStatus('PNG export failed.', 'error')
    }
  }

  useEffect(() => {
    const unsaved = currentFilePath ? '' : ' •'
    document.title = `${projectName}${unsaved} — LumaLayout`
  }, [projectName, currentFilePath])

  useEffect(() => {
    if (!projectStorage.supportsPersistentProjects) return

    let cancelled = false
    const restore = async () => {
      const lastId = await projectStorage.getLastOpenedProjectId()
      if (!lastId) return
      const loaded = await projectStorage.loadProject(lastId)
      if (!loaded?.success || !loaded.project || cancelled) return
      importDataRef.current(loaded.project.data, null)
      setCurrentStorageProjectIdRef.current(loaded.project.id)
      showStatus('Reopened browser-saved project.', 'info')
    }
    restore().catch(() => {})
    return () => { cancelled = true }
  }, [projectStorage])

  useEffect(() => {
    const interval = setInterval(() => {
      const data = exportDataRef.current()
      platform.autoSave(data)
      saveWorkingCopy().catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [platform, projectStorage])

  useEffect(() => {
    const removeUndo = platform.onCommand(PlatformCommand.UNDO, () => undo())
    const removeRedo = platform.onCommand(PlatformCommand.REDO, () => redo())
    const removeNewProject = platform.onCommand(PlatformCommand.NEW_PROJECT, () => setShowNewProjectDialog(true))

    const removeSave = platform.onCommand(PlatformCommand.SAVE_PROJECT, async () => {
      if (projectStorage.supportsPersistentProjects) {
        await saveWorkingCopy()
        markSavedRef.current()
        showStatus('Saved in browser.', 'success')
        return
      }
      await downloadProjectFile()
    })

    const removeSaveAs = platform.onCommand(PlatformCommand.SAVE_PROJECT_AS, async () => {
      await downloadProjectFile({ forceSaveAs: true })
    })

    const removeOpenFile = platform.onCommand(PlatformCommand.OPEN_PROJECT, async (payload) => {
      await openProjectFile(payload)
    })

    const removeExportAllPDF = platform.onCommand(PlatformCommand.EXPORT_ALL_PDF, async () => {
      try { await exportAllPdf() } catch { showStatus('PDF export failed.', 'error') }
    })

    const removeExportAllPNG = platform.onCommand(PlatformCommand.EXPORT_ALL_PNG, async () => {
      try { await exportAllPng() } catch { showStatus('PNG export failed.', 'error') }
    })

    return () => {
      removeUndo?.(); removeRedo?.(); removeNewProject?.(); removeSave?.(); removeSaveAs?.(); removeOpenFile?.(); removeExportAllPDF?.(); removeExportAllPNG?.()
    }
  }, [undo, redo, platform, projectStorage])

  // Browser keyboard shortcuts when there are no native menus
  useEffect(() => {
    if (platform.capabilities.hasNativeMenus) return

    const onKeyDown = (event) => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return

      const key = event.key.toLowerCase()

      if (key === 's' && !event.shiftKey) {
        event.preventDefault()
        saveWorkingCopy().then(() => {
          markSavedRef.current()
          showStatus('Saved in browser.', 'success')
        }).catch(() => showStatus('Browser save failed.', 'error'))
      }

      if (key === 's' && event.shiftKey) {
        event.preventDefault()
        downloadProjectFile({ forceSaveAs: true })
      }

      if (key === 'o') {
        event.preventDefault()
        openProjectFile()
      }

      if (key === 'e' && event.shiftKey) {
        event.preventDefault()
        exportAllPdf().catch(() => showStatus('PDF export failed.', 'error'))
      }

      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        exportAllPng().catch(() => showStatus('PNG export failed.', 'error'))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [platform, projectStorage])

  useEffect(() => {
    if (!platform.capabilities.supportsAppCloseControl) return
    const remove = platform.onBeforeClose(() => {
      if (!isDirtyRef.current) platform.requestForceClose()
      else setShowCloseDialog(true)
    })
    return remove
  }, [platform])

  const handleNewProjectConfirm = (name) => {
    newProject(name)
    setCurrentStorageProjectIdRef.current(null)
    setShowNewProjectDialog(false)
  }

  const handleSaveAndClose = async () => {
    const result = await downloadProjectFile()
    if (result?.success) await platform.requestForceClose()
    setShowCloseDialog(false)
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider pointer-events-none ${
            mode === 'blueprint' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {mode === 'blueprint' ? '⬡ Blueprint Mode' : '⚡ Lighting Mode'}
          </div>

          <Canvas />

          <div className="absolute bottom-2 left-3 text-xs font-mono pointer-events-none select-none" style={{ color: 'rgba(100,100,100,0.55)', zIndex: 10 }}>
            v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} ©fairlyOdd L.L.C. {new Date().getFullYear()}
          </div>

          {status && (
            <div className={`absolute right-3 bottom-3 px-3 py-2 rounded-md text-xs shadow-md z-20 ${
              status.kind === 'error' ? 'bg-red-600 text-white' : status.kind === 'success' ? 'bg-green-600 text-white' : 'bg-slate-700 text-white'
            }`}>
              {status.text}
            </div>
          )}
        </div>
      </div>

      <ContextMenu />
      <LabelEditor />

      {showNewProjectDialog && <NewProjectDialog onConfirm={handleNewProjectConfirm} onCancel={() => setShowNewProjectDialog(false)} />}

      {showCloseDialog && (
        <div className="close-dialog-overlay">
          <div className="close-dialog">
            <h3>Unsaved Changes</h3>
            <p><strong>{projectName}</strong> has unsaved changes. Do you want to save before closing?</p>
            <div className="close-dialog-buttons">
              <button className="close-dialog-btn" onClick={() => setShowCloseDialog(false)}>Cancel</button>
              <button className="close-dialog-btn" onClick={() => platform.requestForceClose()}>Don't Save</button>
              <button className="close-dialog-btn primary" onClick={handleSaveAndClose}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
