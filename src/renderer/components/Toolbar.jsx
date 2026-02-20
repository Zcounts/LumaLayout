import React from 'react'
import { useStore } from '../store/useStore'

// ── Icon components (inline SVG for toolbar buttons) ──────────────────────────

function IconSelect() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M4 2l12 7-6 1.5L8 17 4 2z"/>
    </svg>
  )
}

function IconRect() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="5" width="14" height="10" rx="1"/>
    </svg>
  )
}

function IconCircle() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="10" cy="10" r="7"/>
    </svg>
  )
}

function IconText() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <text x="3" y="15" fontSize="14" fontFamily="serif" fontWeight="bold">T</text>
    </svg>
  )
}

function IconDelete() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M6 2h8v2H6zM3 4h14v1H3zM4 5h12l-1 13H5L4 5zm4 2v9h1V7H8zm3 0v9h1V7h-1z"/>
    </svg>
  )
}

function IconZoomIn() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="9" cy="9" r="6"/>
      <line x1="13" y1="13" x2="17" y2="17"/>
      <line x1="9" y1="6" x2="9" y2="12"/>
      <line x1="6" y1="9" x2="12" y2="9"/>
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="9" cy="9" r="6"/>
      <line x1="13" y1="13" x2="17" y2="17"/>
      <line x1="6" y1="9" x2="12" y2="9"/>
    </svg>
  )
}

function IconReset() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 10a6 6 0 1 1 1.2 3.6"/>
      <polyline points="4,6 4,10 8,10"/>
    </svg>
  )
}

// ── Tool button ───────────────────────────────────────────────────────────────

function ToolButton({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={[
        'flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-lg text-xs transition-all',
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {icon}
      <span className="leading-none" style={{ fontSize: '9px' }}>{label}</span>
    </button>
  )
}

// ── Toolbar separator ─────────────────────────────────────────────────────────

function Separator() {
  return <div className="h-6 w-px bg-white/10 mx-1" />
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

export default function Toolbar({ onZoomIn, onZoomOut, onResetView, onDeleteSelected }) {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const currentTool = useStore((s) => s.currentTool)
  const setCurrentTool = useStore((s) => s.setCurrentTool)
  const selectedBlueprintId = useStore((s) => s.selectedBlueprintId)
  const selectedLightingId = useStore((s) => s.selectedLightingId)

  const hasSelection = mode === 'blueprint' ? !!selectedBlueprintId : !!selectedLightingId
  const isBlueprintMode = mode === 'blueprint'

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 border-b"
      style={{
        background: '#1e1f23',
        borderColor: '#3a3b40',
        height: '52px',
      }}
    >
      {/* ── App name ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mr-4 select-none">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #4f96ff 0%, #a855f7 100%)' }}
        >
          L
        </div>
        <span className="font-semibold text-white text-sm tracking-wide">LumaLayout</span>
      </div>

      <Separator />

      {/* ── Mode toggle ──────────────────────────────────────── */}
      <div
        className="flex items-center rounded-lg p-0.5 gap-0.5"
        style={{ background: '#141517' }}
      >
        {/* Blueprint Mode button */}
        <button
          onClick={() => setMode('blueprint')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
            isBlueprintMode
              ? 'text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
          style={
            isBlueprintMode
              ? { background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', boxShadow: '0 0 12px rgba(79,150,255,0.4)' }
              : {}
          }
          title="Blueprint Mode — draw room layout"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
            <rect x="2" y="2" width="12" height="12" rx="1"/>
            <line x1="2" y1="6" x2="14" y2="6"/>
            <line x1="6" y1="6" x2="6" y2="14"/>
          </svg>
          Blueprint
        </button>

        {/* Lighting Mode button */}
        <button
          onClick={() => setMode('lighting')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
            !isBlueprintMode
              ? 'text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
          style={
            !isBlueprintMode
              ? { background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }
              : {}
          }
          title="Lighting Mode — place and arrange lighting icons"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <circle cx="8" cy="8" r="3"/>
            <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="3" y1="3" x2="4.4" y2="4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11.6" y1="11.6" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="13" y1="3" x2="11.6" y2="4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4.4" y1="11.6" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Lighting
        </button>
      </div>

      <Separator />

      {/* ── Blueprint drawing tools (only in Blueprint Mode) ── */}
      {isBlueprintMode && (
        <>
          <ToolButton
            icon={<IconSelect />}
            label="Select"
            active={currentTool === 'select'}
            onClick={() => setCurrentTool('select')}
          />
          <ToolButton
            icon={<IconRect />}
            label="Rect"
            active={currentTool === 'rect'}
            onClick={() => setCurrentTool('rect')}
          />
          <ToolButton
            icon={<IconCircle />}
            label="Circle"
            active={currentTool === 'circle'}
            onClick={() => setCurrentTool('circle')}
          />
          <ToolButton
            icon={<IconText />}
            label="Text"
            active={currentTool === 'text'}
            onClick={() => setCurrentTool('text')}
          />
          <Separator />
        </>
      )}

      {/* ── Delete ───────────────────────────────────────────── */}
      <ToolButton
        icon={<IconDelete />}
        label="Delete"
        active={false}
        disabled={!hasSelection}
        onClick={onDeleteSelected}
      />

      {/* ── Spacer ───────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Mode indicator badge ─────────────────────────────── */}
      <div
        className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-widest"
        style={
          isBlueprintMode
            ? { background: 'rgba(79,150,255,0.15)', color: '#4f96ff', border: '1px solid rgba(79,150,255,0.3)' }
            : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
        }
      >
        {isBlueprintMode ? '📐 Blueprint' : '💡 Lighting'}
      </div>

      <Separator />

      {/* ── Zoom controls ────────────────────────────────────── */}
      <ToolButton icon={<IconZoomIn />} label="Zoom +" onClick={onZoomIn} />
      <ToolButton icon={<IconZoomOut />} label="Zoom −" onClick={onZoomOut} />
      <ToolButton icon={<IconReset />} label="Reset" onClick={onResetView} />
    </div>
  )
}
