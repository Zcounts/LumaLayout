import React, { useEffect } from 'react'
import { useStore } from './store/useStore'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import LabelEditor from './components/LabelEditor'

export default function App() {
  const darkMode = useStore(s => s.darkMode)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const importData = useStore(s => s.importData)
  const exportData = useStore(s => s.exportData)
  const mode = useStore(s => s.mode)

  // Wire up Electron menu events
  useEffect(() => {
    if (!window.electronAPI) return

    const handlers = [
      window.electronAPI.onMenuUndo(() => undo()),
      window.electronAPI.onMenuRedo(() => redo()),
      window.electronAPI.onMenuSave(async () => {
        const data = exportData()
        await window.electronAPI?.saveFile({ data })
      }),
      window.electronAPI.onMenuOpenFile(async ({ data }) => {
        importData(data)
      }),
    ]

    return () => {
      // IPC listeners cleanup is handled by Electron automatically
    }
  }, [undo, redo, importData, exportData])

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
    </div>
  )
}
