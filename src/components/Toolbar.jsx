import React from 'react'
import useStore from '../store/useStore'

/**
 * Top application toolbar.
 * Contains mode toggles (Blueprint / Lighting) and global controls.
 * Full functionality added in Sessions 2 & 3.
 */
export default function Toolbar() {
  const { mode, setMode, zoom, toggleSidebar, sidebarCollapsed } = useStore()

  return (
    <header className="
      flex items-center gap-2 px-3 py-2 shrink-0
      bg-toolbar-bg border-b border-toolbar-border
      select-none
    ">
      {/* App brand */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-white font-semibold tracking-wide text-sm">
          LightPlot
        </span>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        title="Toggle sidebar"
        className="toolbar-btn"
      >
        {sidebarCollapsed ? (
          <SidebarOpenIcon />
        ) : (
          <SidebarCloseIcon />
        )}
      </button>

      <Divider />

      {/* Mode selector */}
      <div className="flex items-center rounded-md overflow-hidden border border-toolbar-border">
        <ModeButton
          label="Blueprint"
          active={mode === 'blueprint'}
          activeColor="bg-accent-blueprint"
          onClick={() => setMode('blueprint')}
          title="Blueprint Mode — design the physical space"
        />
        <ModeButton
          label="Lighting"
          active={mode === 'lighting'}
          activeColor="bg-accent-lighting"
          onClick={() => setMode('lighting')}
          title="Lighting Mode — place and arrange lighting equipment"
        />
      </div>

      <Divider />

      {/* Placeholder action buttons */}
      <PlaceholderBtn label="Undo" title="Undo (Ctrl+Z)" disabled />
      <PlaceholderBtn label="Redo" title="Redo (Ctrl+Y)" disabled />

      <Divider />

      <PlaceholderBtn label="Snap" title="Snap to grid" disabled />
      <PlaceholderBtn label="Grid" title="Toggle grid" disabled />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom indicator */}
      <span className="text-xs text-toolbar-text/60 tabular-nums">
        {Math.round(zoom * 100)}%
      </span>

      <Divider />

      {/* Export placeholder */}
      <PlaceholderBtn label="Export" title="Export (Session 6)" disabled />
    </header>
  )
}

function ModeButton({ label, active, activeColor, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        px-3 py-1 text-xs font-medium transition-colors
        ${active
          ? `${activeColor} text-white`
          : 'bg-transparent text-toolbar-text/60 hover:text-toolbar-text hover:bg-sidebar-hover'
        }
      `}
    >
      {label}
    </button>
  )
}

function PlaceholderBtn({ label, title, disabled }) {
  return (
    <button
      title={title}
      disabled={disabled}
      className="toolbar-btn text-xs px-2 opacity-40 cursor-not-allowed"
    >
      {label}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-toolbar-border mx-1" />
}

function SidebarOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="3" width="12" height="1.5" rx="0.75" />
      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" />
      <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" />
    </svg>
  )
}

function SidebarCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="3" width="5" height="10" rx="1" opacity="0.4" />
      <rect x="9" y="3" width="5" height="10" rx="1" />
    </svg>
  )
}
