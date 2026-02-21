import React from 'react'
import { useStore } from '../store/useStore'

export default function Toolbar() {
  const mode = useStore(s => s.mode)
  const setMode = useStore(s => s.setMode)
  const darkMode = useStore(s => s.darkMode)
  const toggleDarkMode = useStore(s => s.toggleDarkMode)
  const snapToGrid = useStore(s => s.snapToGrid)
  const toggleSnapToGrid = useStore(s => s.toggleSnapToGrid)
  const showGrid = useStore(s => s.showGrid)
  const toggleShowGrid = useStore(s => s.toggleShowGrid)
  const stageScale = useStore(s => s.stageScale)
  const setViewport = useStore(s => s.setViewport)
  const stageX = useStore(s => s.stageX)
  const stageY = useStore(s => s.stageY)
  const sidebarCollapsed = useStore(s => s.sidebarCollapsed)
  const toggleSidebar = useStore(s => s.toggleSidebar)
  const blueprintTool = useStore(s => s.blueprintTool)
  const setBlueprintTool = useStore(s => s.setBlueprintTool)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const historyIndex = useStore(s => s.historyIndex)
  const history = useStore(s => s.history)

  const zoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, 5)
    setViewport(stageX, stageY, newScale)
  }
  const zoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, 0.1)
    setViewport(stageX, stageY, newScale)
  }
  const resetZoom = () => setViewport(0, 0, 1)

  const zoomPct = Math.round(stageScale * 100)
  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-toolbar border-b border-gray-200 dark:border-white/10 select-none">
      {/* App name */}
      <span className="text-gray-800 dark:text-white font-bold text-sm mr-2 tracking-wide">LumaLayout</span>

      <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />

      {/* Sidebar toggle */}
      <button
        className="toolbar-btn"
        onClick={toggleSidebar}
        title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      <div className="w-px h-5 bg-white/20 mx-1" />

      {/* Mode toggle */}
      <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-white/20">
        <button
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            mode === 'blueprint'
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/80'
          }`}
          onClick={() => setMode('blueprint')}
        >
          Blueprint
        </button>
        <button
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            mode === 'lighting'
              ? 'bg-amber-500 text-gray-900'
              : 'text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/80'
          }`}
          onClick={() => setMode('lighting')}
        >
          Lighting
        </button>
      </div>

      {/* Blueprint tools — only in blueprint mode */}
      {mode === 'blueprint' && (
        <>
          <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />
          {[
            { tool: 'select', icon: '↖', label: 'Select' },
            { tool: 'room', icon: '⬡', label: 'Draw Room' },
            { tool: 'rect', icon: '▭', label: 'Rectangle' },
            { tool: 'circle', icon: '○', label: 'Circle' },
            { tool: 'triangle', icon: '△', label: 'Triangle' },
          ].map(({ tool, icon, label }) => (
            <button
              key={tool}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                blueprintTool === tool
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/80 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
              onClick={() => setBlueprintTool(tool)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </>
      )}

      <div className="flex-1" />

      {/* Undo / Redo */}
      <button
        className="toolbar-btn disabled:opacity-30"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6" />
          <path d="M3 13C5 8 9 5 14 5c5 0 9 4 9 9s-4 9-9 9H7" />
        </svg>
      </button>
      <button
        className="toolbar-btn disabled:opacity-30"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6" />
          <path d="M21 13C19 8 15 5 10 5c-5 0-9 4-9 9s4 9 9 9h7" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />

      {/* Grid / snap */}
      <button
        className={`toolbar-btn ${showGrid ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-white/40'}`}
        onClick={toggleShowGrid}
        title={showGrid ? 'Hide Grid' : 'Show Grid'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3h18v18H3z" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
      </button>
      <button
        className={`toolbar-btn ${snapToGrid ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-white/40'}`}
        onClick={toggleSnapToGrid}
        title={snapToGrid ? 'Snap On' : 'Snap Off'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />

      {/* Zoom controls */}
      <button className="toolbar-btn" onClick={zoomOut} title="Zoom Out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
      <button
        className="text-gray-500 dark:text-white/70 text-xs font-mono hover:text-gray-900 dark:hover:text-white cursor-pointer w-12 text-center"
        onClick={resetZoom}
        title="Reset Zoom"
      >
        {zoomPct}%
      </button>
      <button className="toolbar-btn" onClick={zoomIn} title="Zoom In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />

      {/* Dark mode */}
      <button className="toolbar-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          </svg>
        )}
      </button>
    </div>
  )
}
