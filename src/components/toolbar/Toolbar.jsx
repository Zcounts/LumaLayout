import React from 'react'
import useStore from '../../store/useStore'

// ── Icon components (inline SVG for zero dependencies) ─────────────────────
const Icon = ({ children, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-4 h-4 ${className}`}
  >
    {children}
  </svg>
)

const icons = {
  blueprint: (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </Icon>
  ),
  lighting: (
    <Icon>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Icon>
  ),
  drawRoom: (
    <Icon>
      <polyline points="3 6 3 3 6 3" />
      <polyline points="18 3 21 3 21 6" />
      <polyline points="21 18 21 21 18 21" />
      <polyline points="6 21 3 21 3 18" />
    </Icon>
  ),
  rectangle: (
    <Icon>
      <rect x="4" y="6" width="16" height="12" rx="1" />
    </Icon>
  ),
  circle: (
    <Icon>
      <circle cx="12" cy="12" r="8" />
    </Icon>
  ),
  door: (
    <Icon>
      <path d="M13 4H5v16h8V4z" />
      <path d="M13 4c0 4.4 3.6 8 8 8" />
    </Icon>
  ),
  window: (
    <Icon>
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </Icon>
  ),
  grid: (
    <Icon>
      <circle cx="5" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="19" cy="5" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
      <circle cx="19" cy="19" r="1" fill="currentColor" />
    </Icon>
  ),
  zoomIn: (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </Icon>
  ),
  zoomOut: (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </Icon>
  ),
  resetZoom: (
    <Icon>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4" />
    </Icon>
  ),
}

// ── Button components ──────────────────────────────────────────────────────
function ToolButton({ icon, label, active, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
        transition-all duration-150 select-none
        ${active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-slate-600 mx-1" />
}

// ── Main Toolbar ────────────────────────────────────────────────────────────
export default function Toolbar() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const blueprintTool = useStore((s) => s.blueprintTool)
  const setBlueprintTool = useStore((s) => s.setBlueprintTool)
  const snapToGrid = useStore((s) => s.snapToGrid)
  const toggleSnapToGrid = useStore((s) => s.toggleSnapToGrid)
  const scale = useStore((s) => s.scale)
  const setScale = useStore((s) => s.setScale)
  const setStagePos = useStore((s) => s.setStagePos)
  const isDrawingRoom = useStore((s) => s.isDrawingRoom)
  const resetRoomPoints = useStore((s) => s.resetRoomPoints)

  const isBlueprint = mode === 'blueprint'

  const handleModeToggle = (newMode) => {
    if (newMode === mode) return
    if (isDrawingRoom) resetRoomPoints()
    setMode(newMode)
  }

  const handleBlueprintTool = (tool) => {
    if (isDrawingRoom) resetRoomPoints()
    setBlueprintTool(blueprintTool === tool ? null : tool)
  }

  const handleZoom = (delta) => {
    setScale(scale * delta)
  }

  const handleResetView = () => {
    setScale(1)
    setStagePos({ x: 0, y: 0 })
  }

  return (
    <header className="flex items-center gap-1 px-3 h-12 bg-slate-800 border-b border-slate-700 shadow-md z-10 flex-shrink-0">
      {/* App name */}
      <span className="text-white font-bold text-sm tracking-wide mr-2 pr-2 border-r border-slate-600">
        LumaLayout
      </span>

      {/* Mode toggle */}
      <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5">
        <button
          onClick={() => handleModeToggle('blueprint')}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
            transition-all duration-150 select-none
            ${isBlueprint
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
            }
          `}
          title="Blueprint Mode — design the physical space"
        >
          {icons.blueprint}
          <span>Blueprint</span>
        </button>
        <button
          onClick={() => handleModeToggle('lighting')}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
            transition-all duration-150 select-none
            ${!isBlueprint
              ? 'bg-amber-500 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
            }
          `}
          title="Lighting Mode — place lights and equipment"
        >
          {icons.lighting}
          <span>Lighting</span>
        </button>
      </div>

      <Divider />

      {/* Blueprint tools (only visible in Blueprint Mode) */}
      {isBlueprint && (
        <>
          <ToolButton
            icon={icons.drawRoom}
            label="Draw Room"
            active={blueprintTool === 'draw-room'}
            onClick={() => handleBlueprintTool('draw-room')}
          />
          <ToolButton
            icon={icons.rectangle}
            label="Rectangle"
            active={blueprintTool === 'add-rectangle'}
            onClick={() => handleBlueprintTool('add-rectangle')}
          />
          <ToolButton
            icon={icons.circle}
            label="Circle"
            active={blueprintTool === 'add-circle'}
            onClick={() => handleBlueprintTool('add-circle')}
          />
          <ToolButton
            icon={icons.door}
            label="Door"
            active={blueprintTool === 'add-door'}
            onClick={() => handleBlueprintTool('add-door')}
          />
          <ToolButton
            icon={icons.window}
            label="Window"
            active={blueprintTool === 'add-window'}
            onClick={() => handleBlueprintTool('add-window')}
          />

          {/* In-progress room drawing indicator */}
          {isDrawingRoom && (
            <span className="ml-1 text-xs text-blue-400 animate-pulse">
              Drawing room — click first point to close
            </span>
          )}

          <Divider />
        </>
      )}

      {/* Lighting mode indicator */}
      {!isBlueprint && (
        <>
          <span className="text-xs text-amber-400 font-medium px-1">
            Blueprint elements are locked in Lighting Mode
          </span>
          <Divider />
        </>
      )}

      {/* Snap to grid */}
      <ToolButton
        icon={icons.grid}
        label="Snap to Grid"
        active={snapToGrid}
        onClick={toggleSnapToGrid}
      />

      <Divider />

      {/* Zoom controls */}
      <ToolButton
        icon={icons.zoomOut}
        label=""
        onClick={() => handleZoom(1 / 1.2)}
      />
      <span className="text-xs text-slate-400 w-12 text-center tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <ToolButton
        icon={icons.zoomIn}
        label=""
        onClick={() => handleZoom(1.2)}
      />
      <ToolButton
        icon={icons.resetZoom}
        label="Reset View"
        onClick={handleResetView}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode badge (right side) */}
      <div className={`
        px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase
        ${isBlueprint
          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
        }
      `}>
        {isBlueprint ? 'Blueprint Mode' : 'Lighting Mode'}
      </div>
    </header>
  )
}
