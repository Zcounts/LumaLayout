import React, { useState, useRef, useCallback } from 'react'
import { ICON_CATEGORIES } from '../iconRegistry'
import { useStore } from '../store/useStore'

// ── Category chevron ──────────────────────────────────────────────────────────

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-3 h-3 transition-transform duration-200"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <polyline points="4,2 8,6 4,10" />
    </svg>
  )
}

// ── Single draggable icon item ────────────────────────────────────────────────

function IconItem({ icon, onDragStart }) {
  const handleDragStart = useCallback(
    (e) => {
      // Store icon metadata in drag event
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/lumalayout-icon', JSON.stringify(icon))

      // Create a drag image
      const ghost = document.createElement('img')
      ghost.src = icon.url
      ghost.style.width = '48px'
      ghost.style.height = '48px'
      ghost.style.position = 'fixed'
      ghost.style.top = '-100px'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 24, 24)
      setTimeout(() => document.body.removeChild(ghost), 0)

      onDragStart && onDragStart(icon)
    },
    [icon, onDragStart]
  )

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? handleDragStart : undefined}
      className={[
        'sidebar-icon-item flex flex-col items-center gap-1 p-2 rounded-lg',
        onDragStart ? 'cursor-grab active:cursor-grabbing' : 'opacity-40',
      ].join(' ')}
      style={{ background: 'rgba(255,255,255,0.04)' }}
      title={onDragStart ? `Drag "${icon.label}" onto canvas` : 'Switch to Lighting Mode to drag icons'}
    >
      <img
        src={icon.url}
        alt={icon.label}
        className="w-10 h-10 object-contain pointer-events-none"
        draggable={false}
      />
      <span
        className="text-center leading-tight"
        style={{ fontSize: '9px', color: '#9a9b9f', maxWidth: '52px' }}
      >
        {icon.label}
      </span>
    </div>
  )
}

// ── Collapsible category section ──────────────────────────────────────────────

function CategorySection({ category, onDragStart }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b" style={{ borderColor: '#2a2b2f' }}>
      {/* Category header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-white/5"
        style={{ color: '#c4c5c9' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>
          {category.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#555', fontSize: '9px' }}>
            {category.icons.length}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {/* Icon grid */}
      {open && (
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
          {category.icons.map((icon) => (
            <IconItem key={icon.id} icon={icon} onDragStart={onDragStart} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function IconSidebar({ onDragStart }) {
  const mode = useStore((s) => s.mode)
  const isLightingMode = mode === 'lighting'

  return (
    <div
      className="flex flex-col h-full overflow-hidden border-r"
      style={{
        width: '160px',
        background: '#1a1b1e',
        borderColor: '#3a3b40',
      }}
    >
      {/* Sidebar header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: '#3a3b40' }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.5" className="w-3.5 h-3.5">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
        <span className="text-xs font-semibold" style={{ color: '#888a8e' }}>
          ICONS
        </span>
      </div>

      {/* Lighting-mode hint */}
      {!isLightingMode && (
        <div
          className="mx-2 mt-2 mb-1 px-2 py-1.5 rounded text-center text-xs flex-shrink-0"
          style={{
            background: 'rgba(79,150,255,0.08)',
            border: '1px solid rgba(79,150,255,0.2)',
            color: '#4f96ff',
            fontSize: '9px',
            lineHeight: '1.4',
          }}
        >
          Switch to <strong>Lighting Mode</strong> to drag icons onto canvas
        </div>
      )}

      {isLightingMode && (
        <div
          className="mx-2 mt-2 mb-1 px-2 py-1.5 rounded text-center text-xs flex-shrink-0"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#f59e0b',
            fontSize: '9px',
            lineHeight: '1.4',
          }}
        >
          Drag icons onto the canvas
        </div>
      )}

      {/* Scrollable icon list */}
      <div className="flex-1 overflow-y-auto">
        {ICON_CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            onDragStart={isLightingMode ? onDragStart : undefined}
          />
        ))}
      </div>
    </div>
  )
}
